// Top landing pages
window.renderLanding = function renderLanding(labels, counts) {
  zingchart.render({
    id: "chartLanding",
    height: "100%",
    width: "100%",
    data: {
      type: "bar",
      plotarea: { margin: "20 12 104 60", "adjust-layout": true },
      scaleX: {
        labels,
        "offset-start": "3%",
        "offset-end": "6%",
        item: { "font-angle": -28, "wrap-text": true, "max-chars": 18 },
      },
      scaleY: {
        label: { text: "sessions" },
        format: "%v",
        guide: { "line-style": "dotted" },
      },
      plot: { "bar-width": "60%", tooltip: { text: "%kt — %v landings" } },
      series: [{ text: "landings", values: counts }],
    },
  });
};
