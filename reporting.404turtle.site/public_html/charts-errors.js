// Errors per minute
window.renderErrors = function renderErrors(labels, values) {
  zingchart.render({
    id: "chartErrors",
    height: "100%",
    width: "100%",
    data: {
      type: "line",
      scaleX: { labels },
      scaleY: { label: { text: "errors/min" } },
      series: [{ text: "errors", values }],
    },
  });
};
