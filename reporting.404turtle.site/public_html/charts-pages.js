// Median load by page
window.renderPages = function renderPages(labels, medians) {
  zingchart.render({
    id: "chartPages",
    height: "100%",
    width: "100%",
    data: {
      type: "bar",
      plotarea: { margin: "20 12 104 60", "adjust-layout": true },
      scaleX: {
        labels,
        "offset-start": "3%",
        "offset-end": "6%",
        item: { "font-angle": -28, "wrap-text": true, "max-chars": 16 },
      },
      scaleY: {
        label: { text: "median ms" },
        format: "%v",
        guide: { "line-style": "dotted" },
      },
      plot: { "bar-width": "60%", tooltip: { text: "%kt — %v ms" } },
      series: [{ text: "median", values: medians }],
    },
  });
};
