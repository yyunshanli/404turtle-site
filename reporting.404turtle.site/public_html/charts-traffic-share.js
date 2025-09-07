// charts-traffic-share.js
(function () {
  function pct(n, total) {
    return total ? (100 * n) / total : 0;
  }
  function shortTxt(s, max = 32) {
    return s && s.length > max ? s.slice(0, max - 1) + "…" : s || "";
  }

  window.renderTrafficShare = function renderTrafficShare(labels, counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    const series = labels.map((path, i) => {
      const p = pct(counts[i], total);
      return {
        text: `${shortTxt(path)} — ${p.toFixed(1)}%`,
        values: [counts[i]],
        tooltip: `${path}\n%npv% (%v views)`,
      };
    });

    zingchart.render({
      id: "chartTrafficShare",
      height: "100%",
      width: "100%",
      data: {
        type: "ring", // donut style
        plotarea: { margin: "10 10 10 10", "adjust-layout": true },
        legend: {
          dock: "right", // move legend off the chart
          align: "left",
          "vertical-align": "middle",
          width: "42%",
          item: { "wrap-text": true, "max-chars": 40, "font-size": 11 },
          "border-width": 0,
        },
        plot: {
          slice: "65%",
          "value-box": { visible: false },
          "ref-angle": 270,
          animation: { effect: 2, method: 5, speed: 300 },
        },
        tooltip: { text: "%t" },
        series,
      },
    });
  };
})();
