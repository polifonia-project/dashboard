window.onload = function () {
    counter();
    chartViz();
    // sidebarContent();
}

function counter() {
    if (data.count) {
        data.count.forEach(element => {
            var query = element.query;
            // check if the query is an API request
            if (query.startsWith('http')) {
                alert('There is an API request.');
                // $.ajax({
                //     type: 'GET',
                //     url: query,
                //     headers: {Accept: 'application/json'},
                //     success: function (returnedJson) {
                //         do things
                //     }
                // }
            } else {
                // if it is a sparql query
                var encoded = encodeURIComponent(query);
                var sparqlEndpoint = data.sparql_endpoint;
                var label = element.label;
                $.ajax({
                    type: 'GET',
                    url: sparqlEndpoint + '?query=' + encoded,
                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                    success: function (returnedJson) {
                        for (i = 0; i < returnedJson.results.bindings.length; i++) {
                            var count = returnedJson.results.bindings[i].count.value;
                            // create div to set the column
                            var generalDiv = document.createElement("div");
                            generalDiv.className = "col-lg-4";
                            // create div to contain number and label
                            var countDiv = document.createElement("div");
                            countDiv.className = "card-body option-2b";
                            countDiv.appendChild(document.createTextNode(count));
                            generalDiv.appendChild(countDiv);
                            // create and append p for label
                            var labelP = document.createElement("p");
                            labelP.appendChild(document.createTextNode(label));
                            countDiv.appendChild(labelP);

                            // get container and append
                            var container = document.getElementById("count_container");
                            container.appendChild(generalDiv);
                        }
                    }
                })
            }
        })
    } else {
        alert("No COUNT found.");
    }
}

function chartViz() {
    if (data.chart) {
        data.chart.forEach((element, index) => {
            var chart = element.chart_type;
            if (chart === "barchart") {
                barchart(element, index);
            } else if (chart === "piechart") {
                alert("Pie chart!");
            }
        }
        )
    }
}

function barchart(element, index) {


    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********

    // where I'll store the data necessary fo the bar chart
    var chartData = [];
    var chartLabels = [];

    var query = element.query;
    // check if the query is an API request
    if (query.startsWith('http')) {
        alert('There is an API request.');
        // $.ajax({
        //     type: 'GET',
        //     url: query,
        //     headers: {Accept: 'application/json'},
        //     success: function (returnedJson) {
        //         do things
        //     }
        // }
    } else {
        // if it is a sparql query
        var encoded = encodeURIComponent(query);
        var sparqlEndpoint = data.sparql_endpoint;
        // var label = element.label;
        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {
                // first create the HTML structure that'll receive the data

                // create canva for bar chart
                var chartCanva = document.createElement("canvas");
                var chartId = "chart" + (index + 1);
                chartCanva.setAttribute("id", chartId);

                // create div that contains canva
                var chartArea = document.createElement("div");
                chartArea.className = "chart-area";
                chartArea.appendChild(chartCanva);

                // create card body div
                var cardBody = document.createElement("div");
                cardBody.className = "card-body";
                cardBody.appendChild(chartArea);

                // create chart title h3 and add data.label as text
                var chartTitle = document.createElement("h3");
                chartTitle.className = "card-title";
                chartTitle.appendChild(document.createTextNode(element.label));

                // create card header
                var cardHeader = document.createElement("div");
                cardHeader.className = "card-header";
                cardHeader.appendChild(chartTitle);

                // get general container and append elements
                var container = document.getElementById("vizContainer");
                container.appendChild(cardHeader);
                container.appendChild(cardBody);

                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    chartLabels[i] = returnedJson.results.bindings[i].x.value;
                    chartData[i] = returnedJson.results.bindings[i].y.value;
                } var ctx = document.getElementById(chartId).getContext("2d");

                var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

                gradientStroke.addColorStop(1, 'rgba(29,140,248,0.2)');
                gradientStroke.addColorStop(0.4, 'rgba(29,140,248,0.0)');
                gradientStroke.addColorStop(0, 'rgba(29,140,248,0)'); //blue colors

                var myChart = new Chart(ctx, {
                    type: 'bar',
                    responsive: true,
                    legend: {
                        display: false
                    },
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            fill: true,
                            backgroundColor: gradientStroke,
                            hoverBackgroundColor: gradientStroke,
                            borderColor: '#1f8ef1',
                            borderWidth: 2,
                            borderDash: [],
                            borderDashOffset: 0.0,
                            data: chartData,
                        }]
                    },
                    options: gradientBarChartConfiguration
                });
            }
        })
    }

}

// function sidebarContent() {
//     // general container
//     var container = document.getElementById("sidebarWrapper");

//     // project logo
//     if (data.logo_path.length > 0) {
//         var logoDiv = document.createElement("div");
//         logoDiv.className("logo");

//         var logoLink = document.createElement("a");
//         logoLink.setAttribute("target", "_blank");
//         logoLink.setAttribute("href", "data.iri_base");

//         var logoImg = document.createElement("img");
//         logoImg.setAttribute("src", data.logo_path);

//         logoLink.appendChild(logoImg);
//         logoDiv.appendChild(logoLink);
//         container.appendChild(generalDiv);
//     }
// }