from test_runner import run_production_tests
from dashboard import compute_metrics, generate_dashboard
import json

def run_evaluation_pipeline():
    # Set to 20 for a quick but robust production smoke test
    TEST_COUNT = 20 
    
    results = run_production_tests(TEST_COUNT)
    metrics = compute_metrics(results)
    
    print("\n" + "="*40)
    print(" FINAL PRODUCTION METRICS")
    print("="*40)
    print(f"Accuracy (Rules):  {metrics['accuracy']*100:.1f}%")
    print(f"Quality (Judge):   {metrics['quality']:.2f}/5.0")
    print(f"Avg Latency:       {metrics['latency']:.2f}s")
    print(f"Failure Rate:      {metrics['failure_rate']*100:.1f}%")
    print("="*40)

    # Production Verdict
    if metrics['accuracy'] > 0.8 and metrics['quality'] > 3.5 and metrics['latency'] < 10.0:
        print("\n VERDICT: PRODUCTION READY")
    else:
        print("\n VERDICT: NEEDS OPTIMIZATION")

    # Generate Graphs
    generate_dashboard(results)

if __name__ == "__main__":
    run_evaluation_pipeline()
