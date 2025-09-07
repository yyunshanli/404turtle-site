function renderErrors(labels, values) {
  const ma = (arr, w = 5) =>
    arr.map((_, i) => {
      const s = Math.max(0, i - w + 1),
        slice = arr.slice(s, i + 1);
      return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2);
    });

  zingchart.render({
    id: "chartErrors",
    height: "100%",
    width: "100%",
    data: {
      type: "line",
      scaleX: { labels },
      scaleY: {
        label: { text: "errors/min" },
        minValue: 0,
        guide: { "line-style": "dotted" },
      },
      plot: { "line-width": 2, marker: { visible: false } },
      series: [
        { text: "errors", values },
        {
          text: "5-min avg",
          values: ma(values, 5),
          "line-width": 1,
          "line-style": "dashed",
        },
      ],
    },
  });
}
