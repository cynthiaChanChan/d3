const margin = { left: 100, right: 20, top: 50, bottom: 100 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.right;
let flag = true;
const t = d3.transition().duration(750);

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3.scaleBand().range([0, width]).padding(0.2);
const y = d3.scaleLinear().range([height, 0]);

const xAxisCall = d3.axisBottom(x);
const yAxisCall = d3.axisLeft(y).tickFormat((d) => "$" + d);

const xAxisGroup = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);

const yAxisGroup = g.append("g").attr("class", "y axis");

g.append("text")
    .text("Month")
    .attr("x", width / 2)
    .attr("y", height + 66)
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("font-weight", "bold");

const yLabel = g
    .append("text")
    .text("Revenue")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -80)
    .attr("font-size", "24px")
    .attr("font-weight", "bold");

d3.json("./data/revenues.json")
    .then((data) => {
        data.forEach((d) => {
            d.revenue = +d.revenue;
            d.profit = +d.profit;
        });

        update(data);
        d3.interval(() => {
            const newData = flag ? data.slice(1) : data;
            flag = !flag;
            update(newData);
        }, 1000);
    })
    .catch((e) => {
        console.error(e.message);
    });

const update = (data) => {
    const value = flag ? "revenue" : "profit";
    const ytext = flag ? "Revenue" : "Profit";

    x.domain(data.map((d) => d.month));
    y.domain([0, d3.max(data, (d) => d[value])]);

    xAxisGroup.transition(t).call(xAxisCall);
    yAxisGroup.transition(t).call(yAxisCall);

    // JOIN new data with old elements.
    const rects = g.selectAll("rect").data(data, (d) => d.month);

    // EXIT old elements not present in new data.
    rects
        .exit()
        .attr("fill", "red")
        .transition(t)
        .attr("height", 0)
        .attr("y", y(0))
        .remove();

    rects
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.month))
        .attr("y", (d) => y(0))
        .attr("width", x.bandwidth)
        .attr("fill", "grey")
        .merge(rects)
        .transition(t)
        .attr("x", (d) => x(d.month))
        .attr("y", (d) => y(d[value]))
        .attr("width", x.bandwidth)
        .attr("height", (d) => height - y(d[value]));

    yLabel.text(ytext);
    console.log(2, rects);
};
