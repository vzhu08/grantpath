"""SYNTHETIC control-flow tests, not a scientific or official R oracle."""
import importlib.util
from pathlib import Path
import unittest
import numpy as np
root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("aimfit_test_worker",root / "modules/aimfit/runtime/worker.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class NumericProtocolTests(unittest.TestCase):
    def classify(self, power, width, target=.6, width_target=None):
        return worker.classify_search(np.array(power),np.array(width),target,width_target,lambda n: {"n": n})

    def test_both_narrowly_fail_is_boundary_not_range_exhaustion(self):
        self.assertEqual(self.classify([.59999996],[1.00000005],.6,1),{"status": "boundary_review"})

    def test_predecessor_boundary_prevents_minimum_certificate(self):
        self.assertEqual(self.classify([.79999996,.81],[2,1],.8),{"status": "boundary_review"})

    def test_robust_minimum_and_predecessor(self):
        self.assertEqual(self.classify([.5,.7],[2,1]),{"status": "found","point": {"n": 3},"predecessor": {"n": 2}})

    def test_range_exhaustion_is_distinct(self):
        self.assertEqual(self.classify([.5],[2]),{"status": "beyond_supported_range"})

    def test_output_decimal_roundtrips_binary64_without_exponent(self):
        for value in [8.765432109876543e-8,1.2345678901234567e12,.05000000000264912,1.0]:
            encoded = worker.formatted(value)
            self.assertNotIn("e",encoded)
            self.assertEqual(float(encoded),value)

    def test_closed_protocol_does_not_accept_arbitrary_paths(self):
        with self.assertRaises(ValueError): worker.closed({"version": "aimfit-numeric-v1","queries": [],"path": "other.py"},["version","queries"])


if __name__ == "__main__": unittest.main()
