// charts-sessdur.js
// Vertical bars, categorical X, tidy margins.
window.renderSessDur = function renderSessDur(labels, counts) {
  const max = Math.max(1, ...counts);
  const step = Math.max(1, Math.ceil(max / 5));

  zingchart.render({
    id: "chartSessDur",
    height: "100%",
    width: "100%",
    data: {
      type: "bar",

      // More bottom room for angled labels
      plotarea: { margin: "24 12 96 60", "adjust-layout": true },

      // Categorical X axis
      scaleX: {
        values: labels,
        "max-items": labels.length,
        "auto-fit": false,
        "offset-start": "3%",
        "offset-end": "6%",
        item: { "font-angle": -28, "wrap-text": true, "max-chars": 16 },
        guide: { visible: false },
        tick: { "line-color": "#ddd" },
      },

      // Numeric Y axis (counts)
      scaleY: {
        label: { text: "sessions" },
        minValue: 0,
        step,
        decimals: 0,
        guide: { "line-style": "dotted" },
      },

      plot: {
        "bar-width": "60%",
        tooltip: { text: "%kt — %v sessions" },
      },

      series: [{ values: counts }],
    },
  });
};
