using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// ゲーム全体を管理するシングルトン。
/// スタート・リセット・UI制御を担当。
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("ゲームオブジェクト参照")]
    public BallController ball;
    public CameraController cameraController;
    public RailBuilder railBuilder;

    [Header("UI参照")]
    public Canvas uiCanvas;
    public Button startButton;
    public Button resetButton;
    public TextMeshProUGUI statusText;
    public TextMeshProUGUI timerText;
    public TextMeshProUGUI titleText;

    [Header("エフェクト")]
    public ParticleSystem goalEffect;

    private float elapsedTime = 0f;
    private bool timerRunning = false;
    private GameState currentState = GameState.Ready;

    public enum GameState
    {
        Ready,      // スタート待機
        Running,    // ボール転がり中
        Goal,       // ゴール達成
        Fell,       // 落下・失敗
    }

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    void Start()
    {
        SetupUI();
        SetState(GameState.Ready);
    }

    void Update()
    {
        // タイマー更新
        if (timerRunning)
        {
            elapsedTime += Time.deltaTime;
            if (timerText != null)
                timerText.text = $"⏱ {elapsedTime:F1}s";
        }

        // キーボードショートカット
        if (Input.GetKeyDown(KeyCode.Space))
        {
            if (currentState == GameState.Ready) OnStartPressed();
            else if (currentState == GameState.Running) OnResetPressed();
        }
        if (Input.GetKeyDown(KeyCode.R)) OnResetPressed();
    }

    void SetupUI()
    {
        if (startButton != null)
            startButton.onClick.AddListener(OnStartPressed);
        if (resetButton != null)
            resetButton.onClick.AddListener(OnResetPressed);
    }

    public void OnStartPressed()
    {
        if (currentState != GameState.Ready) return;

        SetState(GameState.Running);

        if (ball != null)
        {
            ball.StartBall();
        }

        if (cameraController != null)
        {
            cameraController.StartFollowing();
        }
    }

    public void OnResetPressed()
    {
        SetState(GameState.Ready);

        if (ball != null) ball.ResetBall();
        if (cameraController != null) cameraController.StopFollowing();
    }

    /// <summary>
    /// ボールがゴールに到達したときに呼ぶ
    /// </summary>
    public void OnGoal()
    {
        if (currentState != GameState.Running) return;
        SetState(GameState.Goal);

        if (goalEffect != null) goalEffect.Play();
        if (ball != null) ball.Stop();
        if (cameraController != null) cameraController.StopFollowing();

        Debug.Log($"ゴール！ タイム: {elapsedTime:F2}秒");
    }

    /// <summary>
    /// ボールが落下したときに呼ぶ
    /// </summary>
    public void OnBallFell()
    {
        if (currentState != GameState.Running) return;
        SetState(GameState.Fell);
    }

    void SetState(GameState newState)
    {
        currentState = newState;

        switch (newState)
        {
            case GameState.Ready:
                elapsedTime = 0f;
                timerRunning = false;
                if (timerText != null) timerText.text = "⏱ 0.0s";
                if (statusText != null) statusText.text = "SPACE / [スタート] でボールを転がそう！";
                if (startButton != null) startButton.gameObject.SetActive(true);
                if (resetButton != null) resetButton.gameObject.SetActive(false);
                break;

            case GameState.Running:
                timerRunning = true;
                if (statusText != null) statusText.text = "転がり中... R / [リセット] で最初から";
                if (startButton != null) startButton.gameObject.SetActive(false);
                if (resetButton != null) resetButton.gameObject.SetActive(true);
                break;

            case GameState.Goal:
                timerRunning = false;
                if (statusText != null) statusText.text = $"🎉 ゴール！ タイム: {elapsedTime:F2}秒　R でリセット";
                if (startButton != null) startButton.gameObject.SetActive(false);
                if (resetButton != null) resetButton.gameObject.SetActive(true);
                break;

            case GameState.Fell:
                timerRunning = false;
                if (statusText != null) statusText.text = "💧 落ちてしまった... R でリセット";
                if (startButton != null) startButton.gameObject.SetActive(false);
                if (resetButton != null) resetButton.gameObject.SetActive(true);
                // 少し待ってリセット
                Invoke(nameof(OnResetPressed), 2.0f);
                break;
        }
    }
}
