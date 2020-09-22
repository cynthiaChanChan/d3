const margin = { left: 100, right: 100, top: 50, bottom: 100 },
    height = 500 - margin.top - margin.bottom,
    width = 800 - margin.left - margin.right;

let dataset = [];
let yValue = "price_usd";
let coin = "bitcoin";
const dateSlider = $("#date-slider");
const parseTime = d3.timeParse("%d/%m/%Y");
const formatTime = d3.timeFormat("%d/%m/%Y");
// For tooltip
var bisectDate = d3.bisector(function (d) {
    return d.date;
}).left;

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3.scaleTime().range([0, width]);

const y = d3.scaleLinear().range([height, 0]);

// Axis groups
var xAxis = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");
var yAxis = g.append("g").attr("class", "y axis");

// axis labels
const xLabel = g
    .append("text")
    .attr("class", "x axisLabel")
    .attr("y", height + 50)
    .attr("x", width / 2)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Time");
const yLabel = g
    .append("text")
    .attr("class", "y axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -170)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Price ($)");

const xAxisCall = d3.axisBottom(x);

const yAxisCall = d3
    .axisLeft(y)
    .ticks(6)
    .tickFormat(function (d) {
        const formatSi = d3.format(".2s");
        const s = formatSi(d).replace(/["G", "k"]/, function (match) {
            if (match === "k") {
                return "K"; // thousands
            } else if (match === "G") {
                return "B"; // billions
            }
            return match;
        });
        return s;
    });

// Line path generator
const line = d3
    .line()
    .x(function (d) {
        return x(d.date);
    })
    .y(function (d) {
        return y(d.value);
    });

g.append("path").attr("class", "line");

const setSlider = (newData) => {
    dateSlider.slider({
        range: true,
        max: parseTime("31/10/2017").getTime(),
        min: parseTime("12/5/2013").getTime(),
        step: 86400000, // one day
        values: [
            parseTime("12/5/2013").getTime(),
            parseTime("31/10/2017").getTime(),
        ],
        slide: (event, ui) => {
            $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
            $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
            update(newData);
        },
    });
};

const update = function () {
    const coinData = dataset[coin];
    const t = d3.transition().duration(1000);
    const sliderValues = $("#date-slider").slider("values");

    let data = coinData.map(function (d) {
        return {
            date: parseTime(d.date),
            value: +d[yValue],
        };
    });

    data = data.filter(function (d) {
        if (d.value && d.date >= sliderValues[0] && d.date <= sliderValues[1]) {
            return d;
        }
    });
    if (!data.length) {
        return;
    }
    x.domain(d3.extent(data, (d) => d.date));

    y.domain([
        d3.min(data, function (d) {
            return d.value;
        }) / 1.005,
        d3.max(data, function (d) {
            return d.value;
        }) * 1.005,
    ]);
    xAxisCall.scale(x);
    xAxis.transition(t).call(xAxisCall);
    yAxisCall.scale(y);
    yAxis.transition(t).call(yAxisCall);
    g.select(".line").transition(t).attr("d", line(data));

    // Tooltip

    // clear old tooltips
    d3.select(".focus").remove();
    d3.select(".overlay").remove();

    const focus = g.append("g").attr("class", "focus").style("display", "none");

    focus
        .append("line")
        .attr("class", "hover-line hover-line-x")
        .attr("y1", 0)
        .attr("y2", height);

    focus
        .append("line")
        .attr("class", "hover-line hover-line-y")
        .attr("x1", 0)
        .attr("x2", width);

    focus.append("circle").attr("r", 7.5);
    focus.append("text").attr("x", 15).attr("dy", ".31em");

    const handleMousemove = function () {
        const x0 = x.invert(d3.mouse(this)[0]);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.attr("transform", `translate(${x(d.date)}, ${y(d.value)})`);
        focus.select("text").text(d.value);
        focus.select(".hover-line-x").attr("y2", height - y(d.value));
        focus.select(".hover-line-y").attr("x2", -x(d.date));
    };

    g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function () {
            focus.style("display", "block");
        })
        .on("mouseout", function () {
            focus.style("display", "none");
        })
        .on("mousemove", handleMousemove);

    // Update y-axis label
    const newText =
        yValue === "price_usd"
            ? "Price ($)"
            : yValue === "market_cap"
            ? "Market Capitalization ($)"
            : "24 Hour Trading Volume ($)";
    yLabel.text(newText);
};

d3.json("./data/coins.json")
    .then(function (data) {
        dataset = data;
        setSlider();
        update();
        $("#coin-select").on("change", function (e) {
            coin = e.target.value;
            update();
        });

        $("#var-select").on("change", function (e) {
            yValue = e.target.value;
            update();
        });
    })
    .catch((err) => {
        console.error(err.message);
    });
