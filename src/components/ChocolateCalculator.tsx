import { useState, useMemo } from "react";

interface TinctureConfig {
  name: string;
  thcPerMl: number;
  cbdPerMl: number;
}

export default function ChocolateCalculator() {
  // Target amounts per bar
  const [targetCBD, setTargetCBD] = useState(70);
  const [targetTHC, setTargetTHC] = useState(10);
  const [servingsPerBar, setServingsPerBar] = useState(10);

  // Tincture configurations (converted to per-ml for easier math)
  // Default values from Papa Barkley tinctures: concentration per 0.25ml
  const [tincture1, setTincture1] = useState<TinctureConfig>({
    name: "1:1 Tincture",
    thcPerMl: 3.56 / 0.25,  // 14.24 mg/ml
    cbdPerMl: 3.7 / 0.25,   // 14.8 mg/ml
  });

  const [tincture2, setTincture2] = useState<TinctureConfig>({
    name: "30:1 Tincture",
    thcPerMl: 0.3 / 0.25,   // 1.2 mg/ml
    cbdPerMl: 8.18 / 0.25,  // 32.72 mg/ml
  });

  // Calculate the volumes needed by solving a system of linear equations:
  // v1 * thc1 + v2 * thc2 = targetTHC
  // v1 * cbd1 + v2 * cbd2 = targetCBD
  const results = useMemo(() => {
    const { thcPerMl: thc1, cbdPerMl: cbd1 } = tincture1;
    const { thcPerMl: thc2, cbdPerMl: cbd2 } = tincture2;

    // Determinant of the coefficient matrix
    const det = thc1 * cbd2 - thc2 * cbd1;

    if (Math.abs(det) < 0.0001) {
      // Tinctures have the same ratio - can't solve uniquely
      return {
        volume1: 0,
        volume2: 0,
        actualTHC: 0,
        actualCBD: 0,
        actualRatio: 0,
        thcPerServing: 0,
        cbdPerServing: 0,
        error: "Tinctures have the same CBD:THC ratio - cannot solve",
      };
    }

    // Cramer's rule
    const volume1 = (targetTHC * cbd2 - targetCBD * thc2) / det;
    const volume2 = (targetCBD * thc1 - targetTHC * cbd1) / det;

    // Check for negative volumes (impossible with these tinctures)
    if (volume1 < 0 || volume2 < 0) {
      return {
        volume1: Math.max(0, volume1),
        volume2: Math.max(0, volume2),
        actualTHC: 0,
        actualCBD: 0,
        actualRatio: 0,
        thcPerServing: 0,
        cbdPerServing: 0,
        error: volume1 < 0
          ? "Target ratio requires negative high-THC tincture (need higher CBD:THC ratio tinctures)"
          : "Target ratio requires negative high-CBD tincture (need lower CBD:THC ratio tinctures)",
      };
    }

    // Verify the solution
    const actualTHC = volume1 * thc1 + volume2 * thc2;
    const actualCBD = volume1 * cbd1 + volume2 * cbd2;
    const actualRatio = actualTHC > 0 ? actualCBD / actualTHC : 0;

    return {
      volume1,
      volume2,
      actualTHC,
      actualCBD,
      actualRatio,
      thcPerServing: actualTHC / servingsPerBar,
      cbdPerServing: actualCBD / servingsPerBar,
      error: null,
    };
  }, [targetCBD, targetTHC, servingsPerBar, tincture1, tincture2]);

  const updateTincture1 = (field: keyof TinctureConfig, value: string) => {
    if (field === "name") {
      setTincture1({ ...tincture1, name: value });
    } else {
      setTincture1({ ...tincture1, [field]: parseFloat(value) || 0 });
    }
  };

  const updateTincture2 = (field: keyof TinctureConfig, value: string) => {
    if (field === "name") {
      setTincture2({ ...tincture2, name: value });
    } else {
      setTincture2({ ...tincture2, [field]: parseFloat(value) || 0 });
    }
  };

  return (
    <div className="card my-4">
      <div className="card-header">
        <h5 className="mb-0">Tincture Mixing Calculator</h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {/* Target amounts */}
          <div className="col-12">
            <h6>Target Amounts (per bar)</h6>
          </div>
          <div className="col-md-4">
            <label className="form-label">Target CBD (mg)</label>
            <input
              type="number"
              className="form-control"
              value={targetCBD}
              onChange={(e) => setTargetCBD(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Target THC (mg)</label>
            <input
              type="number"
              className="form-control"
              value={targetTHC}
              onChange={(e) => setTargetTHC(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Servings per bar</label>
            <input
              type="number"
              className="form-control"
              value={servingsPerBar}
              onChange={(e) => setServingsPerBar(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Tincture 1 */}
          <div className="col-12 mt-4">
            <h6>High-THC Tincture</h6>
          </div>
          <div className="col-md-4">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={tincture1.name}
              onChange={(e) => updateTincture1("name", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">THC (mg/ml)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={tincture1.thcPerMl}
              onChange={(e) => updateTincture1("thcPerMl", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">CBD (mg/ml)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={tincture1.cbdPerMl}
              onChange={(e) => updateTincture1("cbdPerMl", e.target.value)}
            />
          </div>

          {/* Tincture 2 */}
          <div className="col-12 mt-4">
            <h6>High-CBD Tincture</h6>
          </div>
          <div className="col-md-4">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={tincture2.name}
              onChange={(e) => updateTincture2("name", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">THC (mg/ml)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={tincture2.thcPerMl}
              onChange={(e) => updateTincture2("thcPerMl", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">CBD (mg/ml)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={tincture2.cbdPerMl}
              onChange={(e) => updateTincture2("cbdPerMl", e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        {results.error && (
          <div className="alert alert-warning mt-4" role="alert">
            {results.error}
          </div>
        )}
        <div className="row mt-4">
          <div className="col-12">
            <h6>Recipe</h6>
          </div>
          <div className="col-12">
            <table className="table table-sm">
              <tbody>
                <tr>
                  <th>{tincture1.name}</th>
                  <td className="text-end">{results.volume1.toFixed(2)} ml</td>
                </tr>
                <tr>
                  <th>{tincture2.name}</th>
                  <td className="text-end">{results.volume2.toFixed(2)} ml</td>
                </tr>
                <tr>
                  <th>Total Volume</th>
                  <td className="text-end">
                    {(results.volume1 + results.volume2).toFixed(2)} ml
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h6>Results</h6>
          </div>
          <div className="col-12">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-end">Per Bar</th>
                  <th className="text-end">Per Serving</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>THC</th>
                  <td className="text-end">{results.actualTHC.toFixed(1)} mg</td>
                  <td className="text-end">{results.thcPerServing.toFixed(2)} mg</td>
                </tr>
                <tr>
                  <th>CBD</th>
                  <td className="text-end">{results.actualCBD.toFixed(1)} mg</td>
                  <td className="text-end">{results.cbdPerServing.toFixed(2)} mg</td>
                </tr>
                <tr>
                  <th>Ratio (CBD:THC)</th>
                  <td className="text-end" colSpan={2}>
                    {results.actualRatio.toFixed(1)}:1
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
