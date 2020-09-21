const margin = { left: 80, right: 100, top: 50, bottom: 100 },
    height = 500 - margin.top - margin.bottom,
    width = 800 - margin.left - margin.right;

const parseTime = d3.timeParse("%Y");
// For tooltip
var bisectDate = d3.bisector(function (d) {
    return d.year;
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

// Y-Axis label
yAxis
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .attr("fill", "#5D6971")
    .text("Population)");

const xAxisCall = d3.axisBottom(x);
const yAxisCall = d3
    .axisLeft(y)
    .ticks(6)
    .tickFormat(function (d) {
        return parseInt(d / 1000, 10) + "k";
    });

// Line path generator
const line = d3
    .line()
    .x(function (d) {
        return x(d.year);
    })
    .y(function (d) {
        return y(d.value);
    });

d3.json("./data/example.json")
    .then(function (data) {
        data.forEach(function (d) {
            d.year = parseTime(d.year);
            d.value = +d.value;
        });

        console.log(data);

        x.domain(
            d3.extent(data, function (d) {
                return d.year;
            })
        );

        y.domain([
            d3.min(data, function (d) {
                return d.value;
            }) / 1.005,
            d3.max(data, function (d) {
                return d.value;
            }) * 1.005,
        ]);

        xAxis.call(xAxisCall);
        yAxis.call(yAxisCall);

        g.append("path").attr("class", "line").attr("d", line(data));

        // Tooltip

        const focus = g
            .append("g")
            .attr("class", "focus")
            .style("display", "none");

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
            const d = x0 - d0 > d1 - x0 ? d1 : d0;

            focus.attr("transform", `translate(${x(d.year)}, ${y(d.value)})`);
            focus.select("text").text(d.value);
            focus.select(".hover-line-x").attr("y2", height - y(d.value));
            focus.select(".hover-line-y").attr("x2", -x(d.year));
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
    })
    .catch((err) => {
        console.error(err.message);
    });
