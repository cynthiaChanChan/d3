const margin = {
    top: 10,
    right: 10,
    bottom: 100,
    left: 100,
};

const width = 800 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

const continents = ["africa", "americas", "europe", "asia"];

//Time index
let timeIndex = 0;
let interval = null;
let allData = null;
let newData = null;
let startYear = 1950;
const dateSlider = $("#date-slider");
const yearElem = $("#year");

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Define the div for the tooltip
const tooltip = d3
    .select("#chart-area")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//Scales
const xScale = d3.scaleLog().base(10).domain([142, 150000]).range([0, width]);
const yScale = d3.scaleLinear().domain([0, 90]).range([height, 0]);
const radius = d3.scaleSqrt().domain([0, 1400000000]).range([0, 30]);
const contientColor = d3.scaleOrdinal(d3.schemePastel1);

//Axes
const xAxisCall = d3
    .axisBottom(xScale)
    .tickValues([400, 4000, 40000])
    .tickFormat(d3.format("$"));
const yAxisCall = d3.axisLeft(yScale);

g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxisCall);
g.append("g").attr("class", "y-axis").call(yAxisCall);

// Legend
const legendGroup = g
    .append("g")
    .attr("transform", `translate(${width - 10}, ${height - 125})`);

continents.forEach((continent, i) => {
    const legendRow = legendGroup
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

    legendRow
        .append("rect")
        .attr("height", 10)
        .attr("width", 10)
        .attr("fill", contientColor(continent));
    legendRow
        .append("text")
        .text(continent)
        .style("text-transform", "capitalize")
        .attr("text-anchor", "end")
        .attr("x", -10)
        .attr("y", 10);
});

//Labels
g.append("text")
    .attr("class", "x-label")
    .attr("font-size", "20px")
    .text("GDP Per Capita($)")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle");

g.append("text")
    .attr("class", "y-label")
    .attr("font-size", "20px")
    .text("Life Expectancy(Years)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)");

const timeLabel = g
    .append("text")
    .attr("class", "year")
    .attr("font-size", "30px")
    .attr("fill", "grey")
    .attr("x", width)
    .attr("y", height - 10)
    .attr("text-anchor", "end");

tooltip.addContent = (d) => {
    return `<span>Country: ${d.country}</span><br>
    <span>Continent: ${d.continent}</span><br>
    <span>Life Expectancy: ${d3.format(".2f")(d.life_exp)}</span><br>
    <span>GDP Per Capita: ${d3.format("$,.0f")(d.income)}</span><br>
    <span>Population: ${d3.format(",.0f")(d.population)}</span>`;
};

tooltip.show = function () {
    const elem = d3.select(this);
    tooltip
        .transition()
        .duration(100)
        .style("opacity", 0.9)
        .style("left", +elem.attr("cx") + margin.left + "px")
        .style("top", +elem.attr("cy") + margin.top + "px");
    tooltip
        .html(tooltip.addContent.apply(this, arguments))
        .style("transform", "translate(-50%, -100%)");
};

tooltip.hide = () => {
    tooltip.transition().duration(100).style("opacity", 0);
};

const update = () => {
    const { countries, year } = newData[timeIndex];
    //Standard transition time
    const t = d3.transition().duration(100);
    //Join new data with old elements.
    const circles = g.selectAll("circle").data(countries, (d) => d.country);

    //Remove old elements not present in the new data
    circles.exit().remove();

    circles
        .enter()
        .append("circle")
        .attr("fill", (d) => contientColor(d.continent))
        .on("mouseover", tooltip.show)
        .on("mouseout", tooltip.hide)
        .merge(circles)
        .transition(t)
        .attr("cx", (d) => xScale(d.income))
        .attr("cy", (d) => yScale(d.life_exp))
        .attr("r", (d) => radius(d.population));

    //update the time label
    timeLabel.text(year);
    yearElem.text(timeIndex + startYear);
    dateSlider.slider("value", timeIndex + startYear);
};

const step = () => {
    timeIndex = timeIndex >= newData.length - 1 ? 0 : timeIndex + 1;
    update();
};

document.getElementById("play-button").addEventListener("click", function () {
    if (this.textContent.trim() === "Pause") {
        clearInterval(interval);
        this.textContent = "Play";
    } else {
        interval = setInterval(() => {
            step();
        }, 100);
        this.textContent = "Pause";
    }
});

document.getElementById("reset-button").addEventListener("click", () => {
    timeIndex = 0;
    update();
});

document
    .getElementById("continent-select")
    .addEventListener("change", function () {
        if (this.value === "all") {
            newData = [...allData];
        } else {
            newData = allData.map((item) => {
                const countries = item.countries.filter((country) => {
                    return this.value === country.continent;
                });
                return { countries: countries, year: item.year };
            });
        }
        update();
    });

const setSlider = (newData) => {
    dateSlider.slider({
        min: startYear,
        max: startYear + newData.length - 1,
        step: 1,
        range: false,
        slide: (event, ui) => {
            timeIndex = ui.value - startYear;
            update();
        },
    });
};

d3.json("./data/data.json")
    .then((data) => {
        //Filter data
        data.forEach((item) => {
            item.countries = item.countries.filter((country) => {
                if (country.income && country.life_exp) {
                    country.income = +country.income;
                    country.life_exp = +country.life_exp;
                    country.population = +country.population;
                    return country;
                }
            });
        });

        allData = data;
        newData = [...data];

        setSlider(newData);

        update();

        interval = setInterval(() => {
            step();
        }, 100);
    })
    .catch((e) => {
        console.error(e.message);
    });
