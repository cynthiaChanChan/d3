const margin = { left: 100, right: 10, top: 30, bottom: 150 };

const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// X Label
g.append("text")
    .text("The word's tallest buildings")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle");

// Y Label
g.append("text")
    .text("Height (m)")
    .attr("class", "y axis-label")
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -60);

d3.json("data/buildings.json").then((data) => {
    data.forEach((d) => (d.height = +d.height)); // height会给string, 需要自己转number

    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.name))
        .range([0, width])
        .paddingInner(0.2)
        .paddingOuter(0.2);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.height)])
        .range([height, 0]);

    const yAxisCall = d3
        .axisLeft(y)
        .ticks(3)
        .tickFormat((d) => d + "m");
    g.append("g").attr("class", "y axis").call(yAxisCall);

    const xAxisCall = d3.axisBottom(x);
    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxisCall)
        .selectAll("text")
        .attr("transform", `rotate(-40)`)
        .attr("text-anchor", "end")
        .attr("x", -5)
        .attr("y", 10);

    const rects = g.selectAll("rect").data(data);

    rects
        .enter()
        .append("rect")
        .attr("x", (d) => {
            return x(d.name);
        })
        .attr("y", (d) => y(d.height))
        .attr("height", (d) => height - y(d.height))
        .attr("width", x.bandwidth)
        .attr("fill", (d) => "grey");
});
