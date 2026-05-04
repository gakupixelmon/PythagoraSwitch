using UnityEngine;

/// <summary>
/// ピタゴラスイッチのボールを制御するスクリプト。
/// 物理演算によりレール上を転がる。
/// </summary>
[RequireComponent(typeof(Rigidbody))]
public class BallController : MonoBehaviour
{
    [Header("ボール設定")]
    [Tooltip("ボールの質量 (kg)")]
    public float mass = 0.5f;

    [Tooltip("ボールの転がり摩擦")]
    public float rollingDrag = 0.3f;

    [Tooltip("空気抵抗")]
    public float angularDrag = 0.1f;

    [Tooltip("物理マテリアルのバウンス係数")]
    [Range(0f, 1f)]
    public float bounciness = 0.2f;

    [Header("スタート設定")]
    [Tooltip("ボールの初期位置（スタート時に戻る）")]
    public Vector3 startPosition;

    private Rigidbody rb;
    private bool isRunning = false;
    private TrailRenderer trailRenderer;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.mass = mass;
        rb.linearDamping = rollingDrag;
        rb.angularDamping = angularDrag;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;

        // 物理マテリアル設定
        var physMat = new PhysicsMaterial("BallMat");
        physMat.bounciness = bounciness;
        physMat.dynamicFriction = 0.4f;
        physMat.staticFriction = 0.5f;
        physMat.frictionCombine = PhysicsMaterialCombine.Average;
        physMat.bounceCombine = PhysicsMaterialCombine.Minimum;

        var col = GetComponent<Collider>();
        if (col != null) col.material = physMat;

        // トレイル設定
        trailRenderer = GetComponent<TrailRenderer>();

        startPosition = transform.position;
    }

    void Start()
    {
        Stop();
    }

    /// <summary>
    /// ボールをスタートさせる
    /// </summary>
    public void StartBall()
    {
        isRunning = true;
        rb.isKinematic = false;
        if (trailRenderer != null) trailRenderer.emitting = true;
    }

    /// <summary>
    /// ボールを停止させる
    /// </summary>
    public void Stop()
    {
        isRunning = false;
        rb.isKinematic = true;
        if (trailRenderer != null) trailRenderer.emitting = false;
    }

    /// <summary>
    /// ボールを初期位置にリセットする
    /// </summary>
    public void ResetBall()
    {
        Stop();
        transform.position = startPosition;
        transform.rotation = Quaternion.identity;
        rb.linearVelocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;
        if (trailRenderer != null) trailRenderer.Clear();
    }

    /// <summary>
    /// ボールが動いているか
    /// </summary>
    public bool IsRunning => isRunning;

    /// <summary>
    /// ボールが画面外に落ちた時のリセット
    /// </summary>
    void Update()
    {
        if (isRunning && transform.position.y < -10f)
        {
            Debug.Log("ボールが落下しました。リセットします。");
            GameManager.Instance?.OnBallFell();
        }
    }
}
