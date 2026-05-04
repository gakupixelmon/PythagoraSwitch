using UnityEngine;

/// <summary>
/// カメラがボールをスムーズに追従するスクリプト
/// </summary>
public class CameraController : MonoBehaviour
{
    [Header("追従ターゲット")]
    public Transform target;

    [Header("カメラ設定")]
    [Tooltip("ターゲットからのオフセット")]
    public Vector3 offset = new Vector3(0f, 3f, -6f);

    [Tooltip("追従の滑らかさ（値が大きいほど遅い）")]
    [Range(0.01f, 1f)]
    public float smoothTime = 0.3f;

    [Tooltip("回転速度")]
    public float rotationSmoothTime = 0.2f;

    [Tooltip("ターゲット未設定時の俯瞰カメラを使うか")]
    public bool useOverviewWhenNoTarget = true;

    [Tooltip("俯瞰カメラの位置")]
    public Vector3 overviewPosition = new Vector3(0f, 12f, -8f);

    [Tooltip("俯瞰カメラの角度")]
    public Vector3 overviewRotation = new Vector3(45f, 0f, 0f);

    private Vector3 velocity = Vector3.zero;
    private bool isFollowing = false;

    void LateUpdate()
    {
        if (target == null || !isFollowing)
        {
            // 俯瞰ビュー
            if (useOverviewWhenNoTarget)
            {
                transform.position = Vector3.SmoothDamp(transform.position, overviewPosition, ref velocity, smoothTime);
                transform.rotation = Quaternion.Slerp(
                    transform.rotation,
                    Quaternion.Euler(overviewRotation),
                    Time.deltaTime / rotationSmoothTime
                );
            }
            return;
        }

        // ターゲット追従
        Vector3 desiredPosition = target.position + offset;
        transform.position = Vector3.SmoothDamp(transform.position, desiredPosition, ref velocity, smoothTime);

        // ボールを見る
        Vector3 lookDir = target.position - transform.position;
        if (lookDir != Vector3.zero)
        {
            Quaternion targetRotation = Quaternion.LookRotation(lookDir);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime / rotationSmoothTime);
        }
    }

    public void StartFollowing()
    {
        isFollowing = true;
    }

    public void StopFollowing()
    {
        isFollowing = false;
    }

    public void SetTarget(Transform t)
    {
        target = t;
    }
}
