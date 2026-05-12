import matplotlib.pyplot as plt
import numpy as np

def compute_metrics(results):
    success_results = [r for r in results if r["status"] == "SUCCESS"]
    if not success_results:
        return {"error": "No successful tests"}

    avg_rule = sum(r["rule_score"] for r in success_results) / len(success_results)
    avg_judge = sum(r["judge_score"] for r in success_results) / len(success_results)
    avg_latency = sum(r["latency"] for r in success_results) / len(success_results)
    failure_rate = (len(results) - len(success_results)) / len(results)

    return {
        "accuracy": avg_rule,
        "quality": avg_judge,
        "latency": avg_latency,
        "failure_rate": failure_rate
    }

def generate_dashboard(results):
    success_results = [r for r in results if r["status"] == "SUCCESS"]
    
    iterations = [r["iteration"] for r in success_results]
    judge_scores = [r["judge_score"] for r in success_results]
    latencies = [r["latency"] for r in success_results]
    
    plt.figure(figsize=(12, 8))

    # 1. Judge Scores
    plt.subplot(2, 1, 1)
    plt.plot(iterations, judge_scores, color='#58a6ff', marker='o', linestyle='-', linewidth=2)
    plt.axhline(y=3.5, color='#f85149', linestyle='--', label='Production Threshold (3.5)')
    plt.title("LLM Judge Scores (Pedagogical Quality)", color='white')
    plt.ylabel("Score (1-5)")
    plt.grid(True, alpha=0.1)
    plt.legend()

    # 2. Latency
    plt.subplot(2, 1, 2)
    plt.bar(iterations, latencies, color='#3fb950', alpha=0.7)
    plt.title("Latency per Request (Seconds)", color='white')
    plt.ylabel("Time (s)")
    plt.xlabel("Test Case ID")
    plt.grid(True, alpha=0.1)

    plt.tight_layout()
    
    # Save the dashboard as an image
    chart_path = "f:/GEN_AI_ASSISTANT/backend/rag_pipeline/eval/eval_dashboard.png"
    plt.savefig(chart_path, facecolor='#0d1117')
    print(f"\nDashboard saved to: {chart_path}")
    return chart_path
