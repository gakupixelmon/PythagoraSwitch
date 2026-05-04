using UnityEngine;

/// <summary>
/// ピタゴラスイッチのシーンをスクリプトから自動構築するスクリプト。
/// GameObjectに付けてPlayするだけで完全なデモシーンが作られる。
/// </summary>
public class SceneBootstrap : MonoBehaviour
{
    [Header("マテリアル設定")]
    [Tooltip("レール用マテリアル（未設定時は自動生成）")]
    public Material railMaterial;
    [Tooltip("ボール用マテリアル（未設定時は自動生成）")]
    public Material ballMaterial;

    [Header("コース設定")]
    [Tooltip("コースのスケール倍率")]
    public float courseScale = 1.0f;

    void Awake()
    {
        // マテリアルが未設定の場合は自動生成
        if (railMaterial == null) railMaterial = CreateMaterial(new Color(0.6f, 0.4f, 0.2f), "RailMat");     // 木材色
        if (ballMaterial == null) ballMaterial = CreateMaterial(new Color(0.2f, 0.5f, 1.0f), "BallMat");      // 青色
    }

    void Start()
    {
        BuildScene();
    }

    void BuildScene()
    {
        // ===== 地面 =====
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.position = new Vector3(0f, -8f, 0f);
        ground.transform.localScale = new Vector3(5f, 1f, 5f);
        ApplyMaterial(ground, CreateMaterial(new Color(0.2f, 0.25f, 0.2f), "GroundMat"));

        // ===== レールコース構築 =====
        // コースレイアウト（ピタゴラスイッチ風）:
        // 1. スタート台 (斜め直線)
        // 2. 水平直線
        // 3. 右カーブ
        // 4. 急斜面
        // 5. ゆるやかカーブ
        // 6. 最終直線 → ゴール

        GameObject railRoot = new GameObject("RailSystem");
        var railBuilder = railRoot.AddComponent<RailBuilder>();
        railBuilder.railMaterial = railMaterial;
        railBuilder.curveResolution = 15;

        railBuilder.segments = new System.Collections.Generic.List<RailSegmentData>
        {
            // セグメント0: スタート斜め台
            new RailSegmentData {
                startPoint = new Vector3(0f, 5f, 0f),
                endPoint   = new Vector3(0f, 3f, 3f),
                width      = 0.6f,
                height     = 0.08f,
                type       = RailType.Straight
            },
            // セグメント1: 水平直線
            new RailSegmentData {
                startPoint = new Vector3(0f, 3f, 3f),
                endPoint   = new Vector3(0f, 2.8f, 5.5f),
                width      = 0.6f,
                height     = 0.08f,
                type       = RailType.Straight
            },
            // セグメント2: 右カーブ（ベジェ）
            new RailSegmentData {
                startPoint    = new Vector3(0f, 2.8f, 5.5f),
                controlPoint  = new Vector3(2f, 2.5f, 7f),
                endPoint      = new Vector3(4f, 2.2f, 5.5f),
                width         = 0.6f,
                height        = 0.08f,
                type          = RailType.Curved
            },
            // セグメント3: 急斜面
            new RailSegmentData {
                startPoint = new Vector3(4f, 2.2f, 5.5f),
                endPoint   = new Vector3(4f, 0.2f, 8f),
                width      = 0.6f,
                height     = 0.08f,
                type       = RailType.Straight
            },
            // セグメント4: 下段カーブ
            new RailSegmentData {
                startPoint    = new Vector3(4f, 0.2f, 8f),
                controlPoint  = new Vector3(2f, 0.0f, 9.5f),
                endPoint      = new Vector3(0f, -0.2f, 8.5f),
                width         = 0.6f,
                height        = 0.08f,
                type          = RailType.Curved
            },
            // セグメント5: 最終直線 → ゴール
            new RailSegmentData {
                startPoint = new Vector3(0f, -0.2f, 8.5f),
                endPoint   = new Vector3(0f, -1.5f, 12f),
                width      = 0.6f,
                height     = 0.08f,
                type       = RailType.Straight
            },
            // セグメント6: ゴールじょうご
            new RailSegmentData {
                startPoint = new Vector3(0f, -1.5f, 12f),
                endPoint   = new Vector3(0f, -2.5f, 13f),
                width      = 0.8f,
                height     = 0.08f,
                type       = RailType.Funnel
            },
        };

        // ===== ボール =====
        GameObject ballObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        ballObj.name = "Ball";
        ballObj.tag  = "Ball";
        ballObj.transform.position = new Vector3(0f, 5.15f, 0f);
        ballObj.transform.localScale = Vector3.one * 0.18f;
        ApplyMaterial(ballObj, ballMaterial);

        // BounceMaterial
        var ballPhysMat = new PhysicsMaterial("BallPhys");
        ballPhysMat.bounciness = 0.15f;
        ballPhysMat.dynamicFriction = 0.4f;
        ballPhysMat.staticFriction  = 0.5f;
        ballObj.GetComponent<SphereCollider>().material = ballPhysMat;

        var ballController = ballObj.AddComponent<BallController>();

        // トレイル
        var trail = ballObj.AddComponent<TrailRenderer>();
        trail.time = 0.5f;
        trail.startWidth = 0.06f;
        trail.endWidth   = 0.01f;
        var trailMat = new Material(Shader.Find("Sprites/Default"));
        trailMat.color = new Color(0.5f, 0.8f, 1f, 0.6f);
        trail.material = trailMat;
        trail.emitting = false;

        // ===== ゴールトリガー =====
        GameObject goalObj = new GameObject("GoalZone");
        goalObj.transform.position = new Vector3(0f, -2.3f, 13.2f);
        var goalCollider = goalObj.AddComponent<BoxCollider>();
        goalCollider.size = new Vector3(1f, 1f, 1f);
        goalCollider.isTrigger = true;
        goalObj.AddComponent<GoalTrigger>();

        // ゴールビジュアル（半透明の緑）
        GameObject goalVisual = GameObject.CreatePrimitive(PrimitiveType.Cube);
        goalVisual.name = "GoalVisual";
        goalVisual.transform.SetParent(goalObj.transform);
        goalVisual.transform.localPosition = Vector3.zero;
        goalVisual.transform.localScale = Vector3.one;
        Destroy(goalVisual.GetComponent<Collider>());
        var goalMat = CreateMaterial(new Color(0.1f, 1f, 0.3f, 0.35f), "GoalMat");
        goalMat.SetFloat("_Surface", 1); // Transparent
        ApplyMaterial(goalVisual, goalMat);

        // ===== カメラ設定 =====
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            var camCtrl = mainCam.gameObject.GetComponent<CameraController>();
            if (camCtrl == null) camCtrl = mainCam.gameObject.AddComponent<CameraController>();
            camCtrl.target = ballObj.transform;
            camCtrl.offset = new Vector3(2f, 3f, -5f);
            camCtrl.smoothTime = 0.25f;
            camCtrl.overviewPosition = new Vector3(2f, 10f, -4f);
            camCtrl.overviewRotation = new Vector3(40f, 0f, 0f);

            // GameManager設定
            var gmObj = new GameObject("GameManager");
            var gm = gmObj.AddComponent<GameManager>();
            gm.ball = ballController;
            gm.cameraController = camCtrl;
            gm.railBuilder = railBuilder;

            // UIの生成
            BuildUI(gm);
        }

        // シーン構築完了
        Debug.Log("[SceneBootstrap] ピタゴラスイッチシーンの構築完了！SPACEキーでスタート");
    }

    void BuildUI(GameManager gm)
    {
        // Canvas
        GameObject canvasObj = new GameObject("UI_Canvas");
        var canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var canvasScaler = canvasObj.AddComponent<UnityEngine.UI.CanvasScaler>();
        canvasScaler.uiScaleMode = UnityEngine.UI.CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasScaler.referenceResolution = new Vector2(1920, 1080);
        canvasObj.AddComponent<UnityEngine.UI.GraphicRaycaster>();

        // EventSystem
        var eventSysObj = new GameObject("EventSystem");
        eventSysObj.AddComponent<UnityEngine.EventSystems.EventSystem>();
        eventSysObj.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

        // --- タイトルパネル ---
        GameObject titlePanel = CreatePanel(canvasObj, "TitlePanel",
            new Vector2(0f, 1f), new Vector2(0f, 1f),   // anchor top-left
            new Vector2(300f, 60f),
            new Vector2(155f, -35f),
            new Color(0f, 0f, 0f, 0.5f));

        var titleText = CreateText(titlePanel, "TitleText", "🎬 3D ピタゴラスイッチ",
            new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero,
            new Vector2(280f, 50f), 20, Color.white, FontStyle.Bold);

        // --- ステータスパネル ---
        GameObject statusPanel = CreatePanel(canvasObj, "StatusPanel",
            new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
            new Vector2(600f, 50f),
            new Vector2(0f, 40f),
            new Color(0f, 0f, 0f, 0.6f));

        var statusText = CreateText(statusPanel, "StatusText", "SPACE / [スタート] でボールを転がそう！",
            new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero,
            new Vector2(580f, 40f), 16, Color.white, FontStyle.Normal);

        // --- タイマー ---
        GameObject timerPanel = CreatePanel(canvasObj, "TimerPanel",
            new Vector2(1f, 1f), new Vector2(1f, 1f),
            new Vector2(160f, 50f),
            new Vector2(-85f, -35f),
            new Color(0f, 0f, 0f, 0.5f));

        var timerText = CreateText(timerPanel, "TimerText", "⏱ 0.0s",
            new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero,
            new Vector2(150f, 45f), 20, Color.white, FontStyle.Bold);

        // --- スタートボタン ---
        var startButton = CreateButton(canvasObj, "StartButton", "▶ スタート",
            new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
            new Vector2(0f, 100f), new Vector2(180f, 50f),
            new Color(0.1f, 0.7f, 0.3f));

        // --- リセットボタン ---
        var resetButton = CreateButton(canvasObj, "ResetButton", "↺ リセット",
            new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
            new Vector2(0f, 100f), new Vector2(180f, 50f),
            new Color(0.7f, 0.3f, 0.1f));
        resetButton.gameObject.SetActive(false);

        // GameManagerにUI参照を渡す
        gm.uiCanvas = canvas;
        gm.startButton = startButton;
        gm.resetButton = resetButton;
        gm.statusText = statusText;
        gm.timerText = timerText;
    }

    // --- UI ヘルパー ---

    GameObject CreatePanel(GameObject parent, string name, Vector2 anchorMin, Vector2 anchorMax,
        Vector2 sizeDelta, Vector2 anchoredPos, Color bgColor)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(parent.transform, false);
        var rt = panel.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.sizeDelta = sizeDelta;
        rt.anchoredPosition = anchoredPos;

        var img = panel.AddComponent<UnityEngine.UI.Image>();
        img.color = bgColor;

        return panel;
    }

    TMPro.TextMeshProUGUI CreateText(GameObject parent, string name, string content,
        Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta,
        int fontSize, Color color, FontStyle style)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.anchoredPosition = anchoredPos;
        rt.sizeDelta = sizeDelta;

        var tmp = go.AddComponent<TMPro.TextMeshProUGUI>();
        tmp.text = content;
        tmp.fontSize = fontSize;
        tmp.color = color;
        tmp.alignment = TMPro.TextAlignmentOptions.Center;
        tmp.fontStyle = (style == FontStyle.Bold) ? TMPro.FontStyles.Bold : TMPro.FontStyles.Normal;

        return tmp;
    }

    UnityEngine.UI.Button CreateButton(GameObject parent, string name, string label,
        Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Color bgColor)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent.transform, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.anchoredPosition = anchoredPos;
        rt.sizeDelta = sizeDelta;

        var img = go.AddComponent<UnityEngine.UI.Image>();
        img.color = bgColor;

        var btn = go.AddComponent<UnityEngine.UI.Button>();

        // ボタンテキスト
        GameObject labelGo = new GameObject("Label");
        labelGo.transform.SetParent(go.transform, false);
        var labelRt = labelGo.AddComponent<RectTransform>();
        labelRt.anchorMin = Vector2.zero;
        labelRt.anchorMax = Vector2.one;
        labelRt.offsetMin = Vector2.zero;
        labelRt.offsetMax = Vector2.zero;

        var tmp = labelGo.AddComponent<TMPro.TextMeshProUGUI>();
        tmp.text = label;
        tmp.fontSize = 18;
        tmp.fontStyle = TMPro.FontStyles.Bold;
        tmp.color = Color.white;
        tmp.alignment = TMPro.TextAlignmentOptions.Center;

        return btn;
    }

    Material CreateMaterial(Color color, string matName)
    {
        var mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        if (mat.shader.name == "Hidden/InternalErrorShader")
        {
            // URPが無い場合はStandardにフォールバック
            mat = new Material(Shader.Find("Standard"));
        }
        mat.name = matName;
        mat.color = color;
        return mat;
    }

    void ApplyMaterial(GameObject go, Material mat)
    {
        var r = go.GetComponent<Renderer>();
        if (r != null && mat != null) r.material = mat;
    }
}
