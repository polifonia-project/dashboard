window.onload = function () {
    colorSwitch();
    counter();
    chartViz();
    // sidebarContent();
}

//// WYSIWYG FORM FUNCTIONS ////

// update index of fields in template page (to store the final order)
function updateindex() {
    $('.sortable .block_field').each(function () {
        var idx = $(".block_field").index(this);
        $(this).attr("data-index", idx);
        var everyChild = this.getElementsByTagName("*");
        for (var i = 0; i < everyChild.length; i++) {
            var childid = everyChild[i].id;
            var childname = everyChild[i].name;
            if (childid != undefined) {
                if (!isNaN(+childid.charAt(0))) { everyChild[i].id = idx + '__' + childid.split(/__(.+)/)[1] }
                else { everyChild[i].id = idx + '__' + childid; }
            };
            if (childname != undefined) {
                if (!isNaN(+childname.charAt(0))) { everyChild[i].name = idx + '__' + childname.split(/__(.+)/)[1] }
                else { everyChild[i].name = idx + '__' + childname; }
            };
        };
    });
};

// move blocks up/down when clicking on arrow
function moveUpAndDown() {
    var selected = 0;
    var itemlist = $('.sortable');
    var nodes = $(itemlist).children();
    var len = $(itemlist).children().length;
    // initialize index
    updateindex();

    $(".sortable .block_field").click(function () {
        selected = $(this).index();
    });

    $(".up").click(function (e) {
        e.preventDefault();
        if (selected > 0) {
            jQuery($(itemlist).children().eq(selected - 1)).before(jQuery($(itemlist).children().eq(selected)));
            selected = selected - 1;
            updateindex();
        };

    });
    $(".down").click(function (e) {
        e.preventDefault();
        if (selected < len) {
            jQuery($(itemlist).children().eq(selected + 1)).after(jQuery($(itemlist).children().eq(selected)));
            selected = selected + 1;
            updateindex();
        };
    });


};

// add box
function add_field(name) {
    var contents = "";
    var temp_id = Date.now().toString();

    var text_field = "<input name='text' type='text' id='text' placeholder='Write the text for this paragraph.'>"

    var count_field = "<div class='card-body option-2b' style='max-width: 200%;'><p id='num'></p><p id='lab'></p></div><input name='count_query' type='text' id='count_query' placeholder='Write the SPARQL query for the count.' required><input name='count_label' type='text' id='count_label' placeholder='The label you want to show.' required>";

    var chart_field = "<div class='chart-container'><canvas id='chartid'></canvas></div><div class='form-group'><label for='exampleFormControlSelect2'>Chart Type</label><select name='chart_type' class='form-control' id='chart_type'><option name='linechart' id='linechart'>linechart</option><option name='barchart' id='barchart'>barchart</option><option>Stacked Bar chart</option><option name='bubble_chart'>Bubble chart</option><option>Scatter chart</option></select><label for='largeInput'>SPARQL query</label><input name='chart_query' type='text' class='form-control form-control' id='chart_query' placeholder='Type your query' required><label for='largeInput'>Chart Title</label><input name='chart_title' type='text' class='form-control form-control' id='chart_title' placeholder='Title' required><label class='form-label'>Operations (to be addedd)</label><br></div>"

    var up_down = '<a href="#" class="up"><i class="fas fa-arrow-up"></i></a> <a href="#" class="down"><i class="fas fa-arrow-down"></i></a> <a href="#" class="trash"><i class="far fa-trash-alt"></i></a>';

    if (name == 'textbox') {
        var open_addons = "<p class='block_field' id='text'>";
        var close_addons = "</p>";
        contents += open_addons + up_down + text_field + close_addons;
    } else if (name == 'countbox') {
        var open_addons = "<div class='col block_field' id='count_" + temp_id + "'>";
        var close_addons = "</div>";
        contents += open_addons + up_down + count_field + close_addons;
    } else if (name == 'barchart_box') {
        var open_addons = "<div class='col-12 block_field' id='chart_" + temp_id + "'>";
        var close_addons = "</div>";
        contents += open_addons + up_down + chart_field + close_addons;
    }
    $(".sortable").append(contents);
    updateindex();
    moveUpAndDown();

    // remove field
    $('.trash').click(function (e) {
        e.preventDefault();
        $(this).parent().remove();
    })
}

// preview content

$(function () {
    const update = function () {
        var fields = $('form').serializeArray();
        console.log(fields);
        $('.sortable .block_field').each(function (idx) {
            var count_query = '';
            var count_label = '';
            var chart_query = '';
            var chart_title = '';
            var chart_type = '';
            fields.forEach(element => {

                if (element.name == idx + '__count_query') {
                    count_query = element.value;
                } else if (element.name == idx + '__count_label') {
                    count_label = element.value;
                    $("#" + idx + "__lab").text(count_label);
                } else if (element.name == idx + '__chart_query') {
                    chart_query = element.value;
                } else if (element.name == idx + '__chart_title') {
                    chart_title = element.value;
                } else if (element.name == idx + '__chart_type') {
                    chart_type = element.value
                }


            }

            );

            var sparqlEndpoint = pilot_data.sparql_endpoint;

            var encoded_count = encodeURIComponent(count_query);
            var encoded_chart = encodeURIComponent(chart_query);

            // call for the count
            $.ajax({
                type: 'GET',
                url: sparqlEndpoint + '?query=' + encoded_count,
                headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                success: function (returnedJson) {
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        var count = returnedJson.results.bindings[i].count.value;
                        // console.log(count_label);
                        $("#" + idx + "__num").text(count);

                    }
                }
            });

            // call for the charts



            $.ajax({
                type: 'GET',
                url: sparqlEndpoint + '?query=' + encoded_chart,
                headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                success: function (returnedJson) {
                    if (chart_type == 'barchart') {
                        var chartData = [];
                        var chartLabels = [];
                        for (i = 0; i < returnedJson.results.bindings.length; i++) {
                            chartLabels[i] = returnedJson.results.bindings[i].x.value;
                            chartData[i] = returnedJson.results.bindings[i].y.value;
                        }

                        //  retrieve the chart id
                        var chartId = $("#" + idx + "__chartid");
                        var chartColor = pilot_data.color_code[0];
                        var myBarChart = new Chart(chartId, {
                            type: 'bar',
                            data: {
                                labels: chartLabels,
                                datasets: [{
                                    label: 'Quantity',
                                    backgroundColor: chartColor,
                                    borderColor: chartColor,
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
                    } else if (chart_type == 'linechart') {
                        var chartData = [];
                        var chartLabels = [];
                        for (i = 0; i < returnedJson.results.bindings.length; i++) {
                            chartLabels[i] = returnedJson.results.bindings[i].x.value;
                            chartData[i] = returnedJson.results.bindings[i].y.value;
                        }


                        //  retrieve the chart id
                        var chartId = $("#" + idx + "__chartid");
                        var chartColor = pilot_data.color_code[0];
                        // graph plotting
                        var myLineChart = new Chart(chartId, {
                            type: 'line',
                            data: {
                                labels: chartLabels,
                                datasets: [{
                                    label: "New Entries",
                                    borderColor: chartColor,
                                    pointBorderColor: "#FFF",
                                    pointBackgroundColor: chartColor,
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
                                        fontColor: chartColor,
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

                }
            });
        });

    };
    update();
    $('form').change(update);
})

//// STATISTICS TEMPLATE FUNCTIONS ////

function colorSwitch() {
    // gradient
    var gradientEl = document.querySelector(".panel-header");
    gradientEl.classList.remove("bg-primary-gradient");
    gradientEl.style.background = 'linear-gradient(-45deg,' + pilot_data.color_code[0] + ',' + pilot_data.color_code[1] + ')';
}

function counter() {
    if (pilot_data.dynamic_elements) {
        pilot_data.dynamic_elements.forEach(element => {
            if (element.type == 'count') {
                var query = element.count_query;
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
                    var sparqlEndpoint = pilot_data.sparql_endpoint;
                    var count_label = element.count_label;
                    $.ajax({
                        type: 'GET',
                        url: sparqlEndpoint + '?query=' + encoded,
                        headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                        success: function (returnedJson) {
                            for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                var count = returnedJson.results.bindings[i].count.value;
                                // create div to set the column
                                var generalDiv = document.createElement("div");
                                generalDiv.className = "px-2 pb-2 pb-md-0 text-center";
                                // create div to contain number and label
                                var countDiv = document.createElement("div");
                                countDiv.className = "card-body option-2b";
                                countDiv.appendChild(document.createTextNode(count));
                                generalDiv.appendChild(countDiv);
                                // create and append p for label
                                var labelP = document.createElement("p");
                                labelP.appendChild(document.createTextNode(count_label));
                                countDiv.appendChild(labelP);

                                // get container and append
                                var container = document.getElementById(element.position);
                                container.appendChild(generalDiv);
                            }
                        }
                    })
                }
            }
        })
    }
}

function chartViz() {
    if (pilot_data.dynamic_elements) {
        pilot_data.dynamic_elements.forEach(element => {
            if (element.type == 'chart') {
                var chart = element.chart_type;
                if (chart === "barchart") {
                    barchart(element);
                } else if (chart === "linechart") {
                    linechart(element);
                } else if (chart === "doughnutchart") {
                    doughnutchart(element);
                }
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

function chartHTMLElements(element) {
    // create canva for bar chart
    var chartCanva = document.createElement("canvas");
    var chartId = "chart_" + element.position;
    chartCanva.setAttribute("id", chartId);

    // create div that contains canva
    var chartArea = document.createElement("div");
    chartArea.className = "chart-container";
    chartArea.appendChild(chartCanva);

    // create card body div
    var cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.appendChild(chartArea);

    // create chart title h3 and add element.chart_title as text
    var chartTitle = document.createElement("h3");
    chartTitle.className = "card-title";
    chartTitle.appendChild(document.createTextNode(element.chart_title));

    // create card header
    var cardHeader = document.createElement("div");
    // cardHeader.className = "card-header";
    cardHeader.appendChild(chartTitle);

    // get general container and append elements
    var container = document.getElementById(element.position);
    container.appendChild(cardHeader);
    container.appendChild(cardBody);
}

// colors for charts
function chartColor(colorStart, colorEnd, dataLength) {
    return d3.quantize(d3.interpolateHcl(colorStart, colorEnd), dataLength);
}

function barchart(element) {


    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********

    // where I'll store the data necessary fo the bar chart
    var chartData = [];
    var chartLabels = [];

    var query = element.chart_query;
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
        var sparqlEndpoint = pilot_data.sparql_endpoint;
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
                chartHTMLElements(element);
                //  retrieve the chart id
                var chartId = "chart_" + element.position;
                var chartColor = pilot_data.color_code[0];
                var myBarChart = new Chart(chartId, {
                    type: 'bar',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: 'Quantity',
                            backgroundColor: chartColor,
                            borderColor: chartColor,
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

function linechart(element) {
    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********

    // where I'll store the data necessary fo the bar chart
    var chartData = [];
    var chartLabels = [];

    var query = element.chart_query;
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
        var sparqlEndpoint = pilot_data.sparql_endpoint;
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
                chartHTMLElements(element);
                //  retrieve the chart id
                var chartId = "chart_" + element.position;
                var chartColor = pilot_data.color_code[0];
                // graph plotting
                var myLineChart = new Chart(chartId, {
                    type: 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: "New Entries",
                            borderColor: chartColor,
                            pointBorderColor: "#FFF",
                            pointBackgroundColor: chartColor,
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
                                fontColor: chartColor,
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

function doughnutchart(element) {

    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********


    var query = element.chart_query;
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
        var sparqlEndpoint = pilot_data.sparql_endpoint;

        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                var label = [];
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    if (returnedJson.results.bindings[i].label.value == '') {
                        label[i] = 'other'
                    } else {
                        label[i] = returnedJson.results.bindings[i].label.value;
                    }

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
                    // where I'll store the data necessary for the chart
                    chartData = Object.values(elCount);
                    chartLabels = Object.keys(elCount);

                })

                // create the HTML structure that'll receive the data
                chartHTMLElements(element);
                // retrieve the chart id
                var chartId = "chart_" + element.position;

                // chart colors
                var colors = chartColor(pilot_data.color_code[0], pilot_data.color_code[1], chartLabels.length);

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

function stacked_barchart(element) {

    // get the data that I need
    // now starts a piece of code that is exactly the same from function counter
    // ********


    var query = element.chart_query;
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
        var sparqlEndpoint = pilot_data.sparql_endpoint;

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
                chartHTMLElements(element);
                // retrieve the chart id
                var chartId = "chart_" + element.position;

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