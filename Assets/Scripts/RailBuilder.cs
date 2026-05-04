using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// レールセグメントの設定データ
/// </summary>
[System.Serializable]
public class RailSegmentData
{
    [Tooltip("このセグメントの開始位置")]
    public Vector3 startPoint;

    [Tooltip("このセグメントの終了位置")]
    public Vector3 endPoint;

    [Tooltip("レールの幅")]
    public float width = 0.5f;

    [Tooltip("レールの高さ（厚み）")]
    public float height = 0.1f;

    [Tooltip("レールの種類")]
    public RailType type = RailType.Straight;

    [Tooltip("曲率制御点（Curved の場合に使用）")]
    public Vector3 controlPoint;
}

public enum RailType
{
    Straight,   // 直線
    Curved,     // 曲線（ベジェ）
    Funnel,     // じょうご（ゴールにつながる穴）
}

/// <summary>
/// ピタゴラスイッチのレールをプロシージャルに生成するスクリプト
/// </summary>
public class RailBuilder : MonoBehaviour
{
    [Header("レールのデフォルト設定")]
    public Material railMaterial;
    public float defaultWidth = 0.6f;
    public float defaultThickness = 0.08f;
    public int curveResolution = 20; // ベジェ曲線の分割数

    [Header("レールデータ")]
    public List<RailSegmentData> segments = new List<RailSegmentData>();

    private List<GameObject> generatedRails = new List<GameObject>();

    void Start()
    {
        BuildRails();
    }

    /// <summary>
    /// 全レールを生成する
    /// </summary>
    public void BuildRails()
    {
        // 既存のレールを削除
        ClearRails();

        for (int i = 0; i < segments.Count; i++)
        {
            BuildSegment(segments[i], i);
        }
    }

    void ClearRails()
    {
        foreach (var r in generatedRails)
        {
            if (r != null) DestroyImmediate(r);
        }
        generatedRails.Clear();
    }

    void BuildSegment(RailSegmentData data, int index)
    {
        switch (data.type)
        {
            case RailType.Straight:
                BuildStraightRail(data, index);
                break;
            case RailType.Curved:
                BuildCurvedRail(data, index);
                break;
            case RailType.Funnel:
                BuildFunnelRail(data, index);
                break;
        }
    }

    /// <summary>
    /// 直線レールを生成
    /// </summary>
    void BuildStraightRail(RailSegmentData data, int index)
    {
        Vector3 dir = data.endPoint - data.startPoint;
        float length = dir.magnitude;
        Vector3 center = (data.startPoint + data.endPoint) / 2f;

        // 床板部分
        GameObject rail = CreateBox(
            $"Rail_Straight_{index}",
            center,
            new Vector3(data.width, data.height, length),
            Quaternion.LookRotation(dir.normalized)
        );
        generatedRails.Add(rail);

        // 左右の壁（ガイドレール）
        float wallHeight = 0.15f;
        float wallThickness = 0.04f;
        Vector3 right = Quaternion.LookRotation(dir.normalized) * Vector3.right;

        // 左壁
        GameObject leftWall = CreateBox(
            $"Rail_LeftWall_{index}",
            center + right * (data.width / 2f + wallThickness / 2f) + Vector3.up * wallHeight / 2f,
            new Vector3(wallThickness, wallHeight, length),
            Quaternion.LookRotation(dir.normalized)
        );
        generatedRails.Add(leftWall);

        // 右壁
        GameObject rightWall = CreateBox(
            $"Rail_RightWall_{index}",
            center - right * (data.width / 2f + wallThickness / 2f) + Vector3.up * wallHeight / 2f,
            new Vector3(wallThickness, wallHeight, length),
            Quaternion.LookRotation(dir.normalized)
        );
        generatedRails.Add(rightWall);
    }

    /// <summary>
    /// ベジェ曲線レールを生成
    /// </summary>
    void BuildCurvedRail(RailSegmentData data, int index)
    {
        int steps = curveResolution;
        Vector3 prevPoint = data.startPoint;

        for (int i = 1; i <= steps; i++)
        {
            float t = (float)i / steps;
            // 二次ベジェ曲線
            Vector3 nextPoint = QuadraticBezier(data.startPoint, data.controlPoint, data.endPoint, t);

            var segData = new RailSegmentData
            {
                startPoint = prevPoint,
                endPoint = nextPoint,
                width = data.width,
                height = data.height,
                type = RailType.Straight
            };
            BuildStraightRail(segData, index * 1000 + i);

            prevPoint = nextPoint;
        }
    }

    /// <summary>
    /// じょうご（ゴール用の穴）を生成
    /// </summary>
    void BuildFunnelRail(RailSegmentData data, int index)
    {
        // じょうごは単純に斜め板として表現
        BuildStraightRail(data, index);

        // ゴールマーカー（円柱）
        GameObject goalMarker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        goalMarker.name = $"GoalMarker_{index}";
        goalMarker.transform.position = data.endPoint;
        goalMarker.transform.localScale = new Vector3(0.3f, 0.05f, 0.3f);
        ApplyMaterial(goalMarker, CreateGoalMaterial());
        generatedRails.Add(goalMarker);
    }

    /// <summary>
    /// ボックスオブジェクトを生成してコライダーとメッシュを付ける
    /// </summary>
    GameObject CreateBox(string name, Vector3 position, Vector3 size, Quaternion rotation)
    {
        GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = name;
        go.transform.SetParent(transform);
        go.transform.position = position;
        go.transform.rotation = rotation;
        go.transform.localScale = size;
        ApplyMaterial(go, railMaterial);
        return go;
    }

    void ApplyMaterial(GameObject go, Material mat)
    {
        if (mat == null) return;
        var renderer = go.GetComponent<Renderer>();
        if (renderer != null) renderer.material = mat;
    }

    Material CreateGoalMaterial()
    {
        var mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = new Color(1f, 0.9f, 0.1f); // 黄色
        return mat;
    }

    /// <summary>
    /// 二次ベジェ曲線の補間
    /// </summary>
    Vector3 QuadraticBezier(Vector3 p0, Vector3 p1, Vector3 p2, float t)
    {
        float u = 1f - t;
        return u * u * p0 + 2f * u * t * p1 + t * t * p2;
    }

    /// <summary>
    /// エディタからレールを再生成する（Editor拡張用）
    /// </summary>
    public void RebuildInEditor()
    {
        ClearRails();
        BuildRails();
    }
}
