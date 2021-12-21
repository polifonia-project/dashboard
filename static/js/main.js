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
            } else if (chart === "linechart") {
                linechart(element, index);
            } else if (chart === "doughnutchart") {
                doughnutchart(element, index);
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
                chartArea.className = "chart-container";
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
                // cardHeader.className = "card-header";
                cardHeader.appendChild(chartTitle);

                // get general container and append elements
                var container = document.getElementById("vizContainer");
                container.appendChild(cardHeader);
                container.appendChild(cardBody);

                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    chartLabels[i] = returnedJson.results.bindings[i].x.value;
                    chartData[i] = returnedJson.results.bindings[i].y.value;
                }


                var myBarChart = new Chart(chartId, {
                    type: 'bar',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: 'Quantity',
                            backgroundColor: 'rgb(23, 125, 255)',
                            borderColor: 'rgb(23, 125, 255)',
                            data: chartData,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                    }
                });
            }
        })
    }

}

function linechart(element, index) {
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
                chartArea.className = "chart-container";
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
                // cardHeader.className = "card-header";
                cardHeader.appendChild(chartTitle);

                // get general container and append elements
                var container = document.getElementById("vizContainer");
                container.appendChild(cardHeader);
                container.appendChild(cardBody);

                // what I do: check the number of the month and for any missing month assign null as value
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    chartLabels[i] = returnedJson.results.bindings[i].x.value;
                    chartData[i] = returnedJson.results.bindings[i].y.value;
                }

                // graph plotting
                var myLineChart = new Chart(chartId, {
                    type: 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: "New Entries",
                            borderColor: "#1d7af3",
                            pointBorderColor: "#FFF",
                            pointBackgroundColor: "#1d7af3",
                            pointBorderWidth: 2,
                            pointHoverRadius: 4,
                            pointHoverBorderWidth: 1,
                            pointRadius: 4,
                            backgroundColor: 'transparent',
                            fill: true,
                            borderWidth: 2,
                            data: chartData
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        spanGaps: true,
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 10,
                                fontColor: '#1d7af3',
                            }
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                        tooltips: {
                            bodySpacing: 4,
                            mode: "nearest",
                            intersect: 0,
                            position: "nearest",
                            xPadding: 10,
                            yPadding: 10,
                            caretPadding: 10
                        },
                        layout: {
                            padding: { left: 15, right: 15, top: 15, bottom: 15 }
                        }
                    }
                });
            }
        })
    }

}

function doughnutchart(element, index) {

    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********


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
                chartArea.className = "chart-container";
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
                // cardHeader.className = "card-header";
                cardHeader.appendChild(chartTitle);

                // get general container and append elements
                var container = document.getElementById("vizContainer");
                container.appendChild(cardHeader);
                container.appendChild(cardBody);

                const dataElements = [];
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    dataElements[i] = returnedJson.results.bindings[i].label.value;
                }
                const elCount = {};
                if (element.operations == 'count') {
                    for (const item of dataElements) {
                        if (elCount[item]) {
                            elCount[item] += 1;
                        } else {
                            elCount[item] = 1;
                        }
                    }
                    // where I'll store the data necessary fo the bar chart
                    var chartData = Object.values(elCount);
                    var chartLabels = Object.keys(elCount);


                    var colors = [];
                    for (i = 0; i < chartLabels.length; i++) {
                        var randomColor = Math.floor(Math.random() * 16777215).toString(16);
                        colors.push("#" + randomColor);
                    }
                }




                // chart plotting
                var myDoughnutChart = new Chart(chartId, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: chartData,
                            backgroundColor: colors
                        }],

                        labels: chartLabels
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            position: 'bottom'
                        },
                        layout: {
                            padding: {
                                left: 20,
                                right: 20,
                                top: 20,
                                bottom: 20
                            }
                        }
                    }
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