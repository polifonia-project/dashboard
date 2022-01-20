window.onload = function () {
    colorSwitch();
    counter();
    chartViz();
    // sidebarContent();
}

function colorSwitch() {
    // gradient
    var gradientEl = document.querySelector(".panel-header");
    gradientEl.classList.remove("bg-primary-gradient");
    gradientEl.style.background = 'linear-gradient(-45deg,' + data.color_code[0] + ',' + data.color_code[1] + ')';
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

// function that applies the operation 'count'
function count(arr) {
    let elCount = {};
    for (const item of arr) {
        if (elCount[item]) {
            elCount[item] += 1;
        } else {
            elCount[item] = 1;
        }
    } return elCount;
}

// function that applies the operation 'order_by'
// function order_by(numArray) {
//     numArray.sort(function (a, b) {
//         return a - b;
//     });
//     return numArray;
// }

function chartHTMLElements(element, index) {
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
}

function chartColor(colorStart, colorEnd, dataLength) {
    return d3.quantize(d3.interpolateHcl(colorStart, colorEnd), dataLength);
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

                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    chartLabels[i] = returnedJson.results.bindings[i].x.value;
                    chartData[i] = returnedJson.results.bindings[i].y.value;
                }

                //  create the HTML structure that'll receive the data
                chartHTMLElements(element, index);
                //  retrieve the chart id
                var chartId = "chart" + (index + 1);

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

                // what I do: check the number of the month and for any missing month assign null as value
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    chartLabels[i] = returnedJson.results.bindings[i].x.value;
                    chartData[i] = returnedJson.results.bindings[i].y.value;
                }

                //  create the HTML structure that'll receive the data
                chartHTMLElements(element, index);
                //  retrieve the chart id
                var chartId = "chart" + (index + 1);

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

        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                var label = [];
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    label[i] = returnedJson.results.bindings[i].label.value;
                }
                // alert(dataElements);
                var op = element.operations;

                var chartData = [];
                var chartLabels = [];
                op.forEach(o => {
                    var action = o.action;
                    var param = o.param;
                    // activate the operations on the data
                    if (action.includes('count')) {
                        var elCount = eval(action + '(' + param + ')');
                    }
                    // where I'll store the data necessary fo the bar chart
                    chartData = Object.values(elCount);
                    chartLabels = Object.keys(elCount);

                })

                // create the HTML structure that'll receive the data
                chartHTMLElements(element, index);
                // retrieve the chart id
                var chartId = "chart" + (index + 1);

                // chart colors
                var colors = chartColor(data.color_code[0], data.color_code[1], chartLabels.length);

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

function stacked_barchart(element, index) {

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

        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                const dataElements = [];
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    // dataElements[i] = returnedJson.results.bindings[i].label.value;
                }

                if (element.operations == 'count') {
                    // elCount = count(dataElements);
                }

                // where I'll store the data necessary fo the bar chart
                // var chartData = Object.values(elCount);
                // var chartLabels = Object.keys(elCount);

                // create the HTML structure that'll receive the data
                chartHTMLElements(element, index);
                // retrieve the chart id
                var chartId = "chart" + (index + 1);

                // chart colors
                // var colors = chartColor(data.color_code[0], data.color_code[1], chartLabels.length);

                // chart plotting
                var myMultipleBarChart = new Chart(chartId, {
                    type: 'bar',
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        datasets: [{
                            // label: "First time visitors",
                            // backgroundColor: '#59d05d',
                            // borderColor: '#59d05d',
                            // data: [95, 100, 112, 101, 144, 159, 178, 156, 188, 190, 210, 245],
                        }, {
                            // label: "Visitors",
                            // backgroundColor: '#fdaf4b',
                            // borderColor: '#fdaf4b',
                            // data: [145, 256, 244, 233, 210, 279, 287, 253, 287, 299, 312, 356],
                        }, {
                            // label: "Pageview",
                            // backgroundColor: '#177dff',
                            // borderColor: '#177dff',
                            // data: [185, 279, 273, 287, 234, 312, 322, 286, 301, 320, 346, 399],
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            position: 'bottom'
                        },
                        // title: {
                        //     display: true,
                        //     text: 'Traffic Stats'
                        // },
                        tooltips: {
                            mode: 'index',
                            intersect: false
                        },
                        responsive: true,
                        scales: {
                            xAxes: [{
                                stacked: true,
                            }],
                            yAxes: [{
                                stacked: true
                            }]
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