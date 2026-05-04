using UnityEngine;

/// <summary>
/// ゴールゾーンに触れたときにGameManagerに通知するトリガー
/// </summary>
public class GoalTrigger : MonoBehaviour
{
    [Tooltip("ゴールと判定するタグ（ボールのタグ）")]
    public string ballTag = "Ball";

    private bool triggered = false;

    void OnTriggerEnter(Collider other)
    {
        if (triggered) return;
        if (other.CompareTag(ballTag))
        {
            triggered = true;
            Debug.Log("ゴール！");
            GameManager.Instance?.OnGoal();
        }
    }

    /// <summary>
    /// リセット時に呼ぶ
    /// </summary>
    public void ResetTrigger()
    {
        triggered = false;
    }
}
