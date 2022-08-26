addEventListener("DOMContentLoaded", function () {
    if (Object.getOwnPropertyNames(datastory_data).length > 0) { colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]); }
});

window.onload = function () {
    if (Object.getOwnPropertyNames(datastory_data).length > 0) { queryCounter(); }
    chartViz();
    disableKeypress();
    saveHTML(datastory_data.name);
}

// disable selection of templates other than statistics
$(document).ready(function () {
    $("#exampleFormControlSelect1 option[value='statistics']").removeAttr('disabled');
    $(".navbar-toggler.sidenav-toggler.ml-auto").attr('aria-expanded', 'false');
    if (Object.getOwnPropertyNames(datastory_data).length > 0) {
        getBrightness(datastory_data.color_code[1]);
    }
});

// check for drop down story list and call function
const storyList = document.getElementById('story-list');
if (storyList) {
    fillDropDownList(storyList);
}

//// WYSIWYG FORM FUNCTIONS ////

// disable submit form when pressing return
function disableKeypress() {
    $("input[type='text']").on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            return false;
        }
    });
}

// update index of fields in template page (to store the final order)
function updateindex() {
    $('#sortable [id$="block_field"]').each(function () {
        var idx = $('[id$="block_field"]').index(this) + 1;
        $(this).attr("id", idx + '__block_field');
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

// move blocks up/down when clicking on arrow and delete with trash
// down function
$("#sortable").on('click', "a[id$='down']", function (e) {
    e.preventDefault();
    var numrow = parseInt(this.id.split('__')[0], 10),
        nr = 1,
        current = $("#" + numrow + "__block_field"),
        next = current.next();

    if (next.length) {// if there's row after one that was clicked
        current.insertAfter(next);
    }
    updateindex();

    // up function
}).on('click', "a[id$='up']", function (e) {
    e.preventDefault();

    var numrow = parseInt(this.id.split('__')[0], 10),
        nr = 1,
        current = $("#" + numrow + "__block_field"),
        prev = current.prev();

    if (prev.length) {
        current.insertBefore(prev);
    }
    updateindex();

    // delete function
}).on('click', "a[id$='trash']", function (e) {
    e.preventDefault();
    $(this).parent().remove();
    updateindex();
});

// add box
var counter = 0;
function add_field(name, bind_query_id = "") {
    var contents = "";

    var text_field = "<textarea rows='3' oninput='auto_grow(this)' name='text' type='text' id='" + (counter + 1) + "__text' placeholder='Write the text for this paragraph.'></textarea>"

    var count_field = "<br><div class='card-body justify-content-center option-2b count_result  col-md-4'><p class='counter_num' id='" + (counter + 1) + "__num'></p><p class='counter_label' id='" + (counter + 1) + "__lab'></p></div><textarea name='" + (counter + 1) + "__count_query' type='text' id='" + (counter + 1) + "__count_query' rows='3' placeholder='Write the SPARQL query for the count.' required></textarea><input name='" + (counter + 1) + "__count_label' type='text' id='" + (counter + 1) + "__count_label' placeholder='The label you want to show.' required>";
    var help = 'True';
    var chart_field = "<div class='chart-container'>\
      <canvas id='" + (counter + 1) + "__chartid'></canvas>\
      </div>\
      <div class='form-group' id='" + (counter + 1) + "__form_group'>\
        <label for='exampleFormControlSelect2'>Chart Type</label>\
        <select name='" + (counter + 1) + "__chart_type' class='form-control' id='" + (counter + 1) + "__chart_type'>\
          <option name='" + (counter + 1) + "__linechart' id='" + (counter + 1) + "__linechart'>linechart</option>\
          <option name='" + (counter + 1) + "__barchart' id='" + (counter + 1) + "__barchart'>barchart</option>\
          <option name='" + (counter + 1) + "__doughnutchart' id='" + (counter + 1) + "__doughnutchart'>doughnutchart</option>\
          <option name='" + (counter + 1) + "__scatterplot' id='" + (counter + 1) + "__scatterplot'>scatterplot</option>\
        </select><br/>\
        <label for='largeInput'>SPARQL query</label><br/>\
        <textarea oninput='auto_grow(this)' name='" + (counter + 1) + "__chart_query' type='text' id='" + (counter + 1) + "__chart_query' placeholder='Type your query' rows='3' required></textarea><br/>\
        <input style='display: none;' class='form-control' type='text' name='" + (counter + 1) + "__chart_series' id='" + (counter + 1) + "__chart_series' placeholder='The label for the data series'><br/>\
        <a id='query-btn' style='display: none;' class='btn btn-primary btn-border' extra='True' onclick='add_field(name)' name='query-btn'>Add another query</a><br/>\
        <a href='#' role='button' data-toggle='modal' data-target='#chartsModalLong'>Discover more about query and charts.</a><br/>\
        <label for='largeInput'>Chart Title</label><br/>\
        <input name='" + (counter + 1) + "__chart_title' type='text' class='form-control' id='" + (counter + 1) + "__chart_title' placeholder='Title' required><br/>\
        <br/><label>Operations</label><br/>\
        <input type='checkbox' id='count' name='action1' value='count'>\
        <label for='count'>Count</label><br/>\
        <input type='checkbox' id='sort' name='action2' value='sort'>\
        <label for='count'>Sort</label><br/>\
        </div>";

    var text_search_field = "\
    <input class='textsearch_title' id='" + (counter + 1).toString() + "__textsearch_title' type='text' name='" + (counter + 1).toString() + "__textsearch_title' placeholder='A title, e.g. Search tunes'>\
    <textarea class='addplaceholder_textsearch' \
      oninput='auto_grow(this)' \
      name='" + (counter + 1) + "__textsearch_query' \
      type='text' \
      id='" + (counter + 1) + "__textsearch_query' \
      rows='6' required></textarea>\
    <div class='table-container textsearch_result'>\
      <div class='previewtextsearch col-4' style='background-image: linear-gradient(-45deg, "+ datastory_data.color_code[0] + ", " + datastory_data.color_code[1] + ";'>\
        <input class='textsearch_userinput modifydatastory' id='" + (counter + 1).toString() + "__textsearch_userinput' type='text' name='" + (counter + 1).toString() + "__textsearch_userinput' value=''>\
        <a id='" + (counter + 1).toString() + "__textsearch_button' class='textsearch_button' onclick='perform_textsearch(\"" + (counter + 1).toString() + "__textsearch_userinput\")' name='" + (counter + 1).toString() + "__textsearch'>Search</a>\
      </div>\
      <table class='col-12' id='" + (counter + 1).toString() + "__textsearchid'>\
        <!-- TODO add rows-->\
      </table>\
    </div>\
    <h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle' class='text-white'>Do you want to add an action to your results?</h4>\
    <p>Row values can be subject of new queries and return tables or charts. For each action a button will appear in the table.</p>\
    <a class='btn btn-primary btn-border' \
        onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
        name='tablevalueaction'>Add\
        action to results</a>";

    var tablevalueaction_field = "\
    <input class='tablevalueaction_title' \
      id='" + (counter + 1).toString() + "__tablevalueaction_title' \
      type='text' \
      name='" + (counter + 1).toString() + "__tablevalueaction_title' \
      placeholder='A title, e.g. Show similar tunes'>\
    <input class='tablevalueaction_column' \
      id='" + (counter + 1).toString() + "__tablevalueaction_column' \
      type='text' \
      name='" + (counter + 1).toString() + "__tablevalueaction_column' \
      placeholder='The name of the column'>\
    <input class='tablevalueaction_table' \
      id='" + (counter + 1).toString() + "__tablevalueaction_table' \
      type='hidden' \
      name='" + (counter + 1).toString() + "__tablevalueaction_table' \
      value='"+ bind_query_id + "'>\
    <textarea class='addplaceholder_tablevalueaction'  \
      oninput='auto_grow(this)' \
      name='" + (counter + 1) + "__tablevalueaction_query' \
      type='text' \
      id='" + (counter + 1) + "__tablevalueaction_query' \
      rows='6' required></textarea>\
    <p><em>Type your query and perform a new search above to see the result</em></p>\
    <h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle' class='text-white'>Do you want to add an action to your results?</h4>\
    <p>Row values can be subject of new queries and return tables or charts. \
    For each action a button will appear in the table. You can also combine value results of this action with value results of a prior action or search.</p>\
    <a class='btn btn-primary btn-border' \
        onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
        name='tablevalueaction'>Add\
        action to results</a>\
    <a class='btn btn-primary btn-border' \
        onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
        name='tablecomboaction'>\
        Combine value results</a>";

    var tablecomboaction_field = "\
    <input class='tablevalueaction_title' \
        id='" + (counter + 1).toString() + "__tablevalueaction_title' type='text' \
        name='" + (counter + 1).toString() + "__tablevalueaction_title' \
        placeholder='A title, e.g. Show tunes in common'>\
    <input class='tablevalueaction_table' \
      id='" + (counter + 1).toString() + "__tablevalueaction_table' \
      type='hidden' \
      name='" + (counter + 1).toString() + "__tablevalueaction_table' \
      value='"+ bind_query_id + "'>\
    <input class='tablevalueaction_column' \
        id='" + (counter + 1).toString() + "__tablevalueaction_column' type='text' \
        name='" + (counter + 1).toString() + "__tablevalueaction_column' \
        placeholder='The name of the column to combine'>\
    <input class='tablevalueaction_column' \
        id='" + (counter + 1).toString() + "__tablevalueaction_table_2' type='text' \
        name='" + (counter + 1).toString() + "__tablevalueaction_table_2' \
        placeholder='The name of other table to combine'>\
    <input class='tablevalueaction_column' \
        id='" + (counter + 1).toString() + "__tablevalueaction_column_2' type='text' \
        name='" + (counter + 1).toString() + "__tablevalueaction_column_2' \
        placeholder='The name of the column to combine'>\
    <textarea class='addplaceholder_tablecomboaction' \
        oninput='auto_grow(this)' \
        name='" + (counter + 1) + "__tablecomboaction_query' type='text' \
        id='" + (counter + 1) + "__tablecomboaction_query' \
        rows='6' required></textarea>\
    <p><em>Type your query and perform a new search above to see the result</em></p>\
    <h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle'\
        class='text-white'>Do you want to add an action to your results?</h4>\
    <p>Row values can be subject of new queries and return tables or charts. \
    For each action a button will appear in the table. You can also combine results of this \
    action with results of a prior action or search.</p>\
    <a class='btn btn-primary btn-border' \
        onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
        name='tablevalueaction'>Add\
        action to results</a>\
    <a class='btn btn-primary btn-border' \
        onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
        name='tablecomboaction'>\
        Combine results</a>";


    var up_down = '<a href="#" class="up" id="' + (counter + 1) + '__up" name="' + (counter + 1) + '__up"><i class="fas fa-arrow-up" id="' + (counter + 1) + '__arrow-up"></i></a> \
    <a href="#" class="down" id="' + (counter + 1) + '__down" name="' + (counter + 1) + '__down"><i class="fas fa-arrow-down" id="' + (counter + 1) + '__arrow-down"></i></a> \
    <a href="#" class="trash" id="' + (counter + 1) + '__trash" name="' + (counter + 1) + '__trash"><i class="far fa-trash-alt" id="' + (counter + 1) + '__bin"></i></a><br/>';
    var no_up_down = '<a href="#" class="trash" id="' + (counter + 1) + '__trash" name="' + (counter + 1) + '__trash"><i class="far fa-trash-alt" id="' + (counter + 1) + '__bin"></i></a><br/>';


    if (name == 'textbox') {
        var open_addons = "<div id='" + (counter + 1) + "__block_field' class='typography-line'> <h4 class='block_title'>Add text</h4>";
        var close_addons = "</div>";
        contents += open_addons + up_down + text_field + close_addons;
    } else if (name == 'countbox') {
        var open_addons = "<div class='col' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add counter</h4>";
        var close_addons = "</div>";
        contents += open_addons + up_down + count_field + close_addons;
    } else if (name == 'chart_box') {
        var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add chart</h4>";
        var close_addons = "</div>";
        contents += open_addons + up_down + chart_field + close_addons;
    } else if (name == 'textsearch') {
        var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add text search</h4>";
        var close_addons = "</div>";
        contents += open_addons + up_down + text_search_field + close_addons;
    } else if (name.includes('tablevalueaction')) {
        var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'>  <h4 class='block_title'>Add action</h4>";
        var close_addons = "</div>";
        contents += open_addons + no_up_down + tablevalueaction_field + close_addons;
    } else if (name.includes('tablecomboaction')) {
        var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'>  <h4 class='block_title'>Combine results</h4>";
        var close_addons = "</div>";
        contents += open_addons + no_up_down + tablecomboaction_field + close_addons;
    }

    if (name.includes('query-btn')) {
        addQueryField(name, (counter + 1));
    } else {
        $("#sortable").append(contents);
    }

    colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]);



    // add multiline placeholder
    var placeholder_t = "Type an example text search query using the placeholder <<searchterm>>,\n\
    prefix bds: <http://www.bigdata.com/rdf/search#>\n\
    SELECT DISTINCT ?s ?o \n\
    WHERE { ?o bds:search '<<searchterm>>' . ?s rdfs:label ?o . } LIMIT 10 \nWe will replace the placeholder with the user input";
    $(".addplaceholder_textsearch").attr("placeholder", placeholder_t);

    var placeholder_action = "Type a query based on the entity selected in the table. \n\
    Use the placeholder <<{column name}>> (change {column name} with the name of the column),\n\
    SELECT DISTINCT ?o ?oLabel \n\
    WHERE { <<item>> ?p ?o . ?o rdfs:label ?oLabel .} \n\
    LIMIT 10";
    $(".addplaceholder_tablevalueaction").attr("placeholder", placeholder_action);

    var placeholder_combo = "Type a query based on the entities of the two tables. \n\
    Use the placeholder <<{column name}>> (change {column name} with the name of the column),\n\
    SELECT DISTINCT ?o ?oLabel \n\
    WHERE { <<item>> ?p ?o . <<other>> ?p ?o .} \n\
    LIMIT 10";
    $(".addplaceholder_tablecomboaction").attr("placeholder", placeholder_combo);

    counter = $('#sortable [id$="block_field"]').length;
    updateindex();
}

// add new query field
const addQueryField = (name, idx) => {
    const currentDate = new Date();
    const timestamp = currentDate.getTime();

    let content = '';
    const openDiv = '<div class="query-div">'
    const closeDiv = '</div>'
    const query_field = "<label for='largeInput'>SPARQL query</label><br/>\
    <textarea oninput='auto_grow(this)' id='" + idx + "__extra_query_" + timestamp + "' name='" + idx + "__extra_query_" + timestamp + "' type='text' placeholder='Type your query' required></textarea><br/>\
    <input class='form-control' type='text' id='" + idx + "__extra_series_" + timestamp + "' name='" + idx + "__extra_series_" + timestamp + "' placeholder='The label for the data series' required><br/>";
    const trash = '<a href="#" class="trash" id="trash" name="trash"><i class="far fa-trash-alt" id="bin"></i></a><br/>';
    content = openDiv + trash + query_field + closeDiv;

    const afterElement = document.getElementById(name);
    afterElement.insertAdjacentHTML('beforebegin', content);
}

// preview content
$(function () {
    const update = function () {
        var fields = $('form').serializeArray();
        var color_1 = '';
        var color_2 = '';
        $('#colors').each(function () {
            fields.forEach(element => {
                if (element.name == 1 + '_color') {
                    color_1 = element.value;
                } else if (element.name == 2 + '_color') {
                    color_2 = element.value;
                }
            })
        });
        colorSwitch(color_2, color_1);

        $('#sortable [id$="block_field"]').each(function (idx) {
            console.log(fields);
            var count_query = '';
            var textsearch_query = '';
            var count_label = '';
            var chart_query = '';
            var chart_title = '';
            var chart_type = '';
            var operations = [];
            var chart_series = '';
            var extra_queries = [];
            var extra_series = [];
            fields.forEach(element => {
                if (element.name == (idx + 1) + '__count_query') {
                    count_query = element.value;
                } else if (element.name == (idx + 1) + '__count_label') {
                    count_label = element.value;
                    $("#" + (idx + 1) + "__lab").text(count_label);
                } else if (element.name == (idx + 1) + '__chart_query') {
                    chart_query = element.value;
                } else if (element.name == (idx + 1) + '__textsearch_query') {
                    textsearch_query = element.value;
                } else if (element.name == (idx + 1) + '__chart_title') {
                    chart_title = element.value;
                } else if (element.name == (idx + 1) + '__chart_type') {
                    chart_type = element.value;
                } else if (element.name.includes((idx + 1) + '__action')) {
                    operations.push(element.value);
                } else if (element.name.includes((idx + 1) + '__chart_series')) {
                    chart_series = element.value;
                } else if (element.name.includes((idx + 1) + '__extra_query')) {
                    extra_queries.push(element.value);
                } else if (element.name.includes((idx + 1) + '__extra_series')) {
                    extra_series.push(element.value);
                }
            }

            );

            // show hide elements
            const queryButton = document.getElementById((idx + 1) + '__query-btn'); // if I put them inside the if, everything works.
            const querySeries = document.getElementById((idx + 1) + '__chart_series'); // But hten I have to delete the else, and when I change the chart they remain visible
            if (queryButton) {
                if (chart_type == 'scatterplot') {
                    // show
                    queryButton.style.display = "block";
                    querySeries.style.display = "block";
                } else {
                    // hide
                    queryButton.style.display = "none";
                    querySeries.style.display = "none";
                }
            }

            var sparqlEndpoint = datastory_data.sparql_endpoint;

            var encoded_count = encodeURIComponent(count_query);
            var encoded_chart = encodeURIComponent(chart_query);


            // call for the count
            if (count_query) {
                $.ajax({
                    type: 'GET',
                    url: sparqlEndpoint + '?query=' + encoded_count,
                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                    success: function (returnedJson) {
                        for (i = 0; i < returnedJson.results.bindings.length; i++) {
                            var count = returnedJson.results.bindings[i].count.value;
                            $("#" + (idx + 1) + "__num").text(count);

                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        $("#" + (idx + 1) + "__num").text(xhr.statusText + ' in the query, check and try again.');
                    }
                });
            }

            // call for the charts
            else if (chart_query) {
                // scatter plot
                if (chart_type == 'scatterplot') {
                    let queryArray = [];

                    // check if chart requires extra queries
                    if (extra_queries.length == 0) {
                        // where I'll store the data necessary fo the scatter plot
                        let chartData = [];
                        let tempLabels = [];

                        let query = chart_query;
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
                            var sparqlEndpoint = sparqlEndpoint;
                            $.ajax({
                                type: 'GET',
                                url: sparqlEndpoint + '?query=' + encoded,
                                headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                                success: function (returnedJson) {
                                    const queryResults = returnedJson.results.bindings;
                                    for (entry in queryResults) {
                                        const xValue = parseInt(queryResults[entry].x.value);
                                        const yValue = parseInt(queryResults[entry].y.value);
                                        const entryObj = { x: xValue, y: yValue }
                                        tempLabels.push(xValue);
                                        chartData.push(entryObj);
                                    }

                                    //  retrieve the chart id
                                    var chartId = $("#" + (idx + 1) + "__chartid");
                                    var chartColor = color_2;
                                    // graph plotting
                                    var myScatterChart = new Chart(chartId, {
                                        type: 'scatter',
                                        data: {
                                            datasets: [{
                                                label: chart_series,
                                                data: chartData,
                                                backgroundColor: chartColor
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                },
                                                title: {
                                                    display: true,
                                                    text: chart_title
                                                }
                                            }
                                        }
                                    });
                                }
                            })
                        }
                    } else if (extra_queries.length > 0) {
                        let query = chart_query;
                        let seriesArray = [];
                        let datasetArray = [];
                        queryArray.push(query);
                        seriesArray.push(chart_series);

                        for (e of extra_queries) {
                            queryArray.push(e);
                        }

                        for (s of extra_series) {
                            seriesArray.push(s);
                        }
                        console.log(queryArray);
                        console.log(seriesArray);

                        // generate colors based on number of queries
                        var colors = d3.quantize(d3.interpolateHcl(color_2, color_1), queryArray.length);

                        for (const [i, q] of queryArray.entries()) {
                            let scatter_query = q;
                            let chartData = [];
                            let dataDict = {};

                            // check if the query is an API request
                            if (scatter_query.startsWith('http')) {
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
                                var encoded = encodeURIComponent(scatter_query);
                                var sparqlEndpoint = sparqlEndpoint;
                                $.ajax({
                                    type: 'GET',
                                    url: sparqlEndpoint + '?query=' + encoded,
                                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                                    success: function (returnedJson) {
                                        const queryResults = returnedJson.results.bindings;
                                        for (entry in queryResults) {
                                            const xValue = parseInt(queryResults[entry].x.value);
                                            const yValue = parseInt(queryResults[entry].y.value);
                                            const entryObj = { x: xValue, y: yValue }
                                            chartData.push(entryObj);
                                        }
                                        dataDict.data = chartData;
                                        dataDict.label = seriesArray[i];
                                        dataDict.backgroundColor = colors[i];
                                        datasetArray.push(dataDict);
                                        myScatterChart.update();
                                    }
                                });
                            }
                        }


                        //  retrieve the chart id
                        var chartId = $("#" + (idx + 1) + "__chartid");

                        // graph plotting
                        var myScatterChart = new Chart(chartId, {
                            type: 'scatter',
                            data: data = {
                                datasets: datasetArray
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: chart_title
                                    }
                                }
                            }
                        });
                    }
                }

                $.ajax({
                    type: 'GET',
                    url: sparqlEndpoint + '?query=' + encoded_chart,
                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                    success: function (returnedJson) {
                        if (chart_type == 'barchart') {
                            var chartData = [];
                            var chartLabels = [];
                            // with operations
                            if (operations.length > 0) {
                                var label = [];
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    if (returnedJson.results.bindings[i].label.value == '') {
                                        label[i] = 'Unknown'
                                    } else {
                                        label[i] = returnedJson.results.bindings[i].label.value;
                                    }

                                }

                                operations.forEach(o => {
                                    var action = o
                                    if (action == 'count') {
                                        var param = 'label';
                                        // activate the operations on the data
                                        var elCount = eval(action + '(' + param + ')');
                                        // where I'll store the data necessary for the chart
                                        chartData = Object.values(elCount);
                                        chartLabels = Object.keys(elCount);
                                    }
                                })
                            } else if (operations.length == 0) {
                                // without operations
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    chartLabels[i] = returnedJson.results.bindings[i].label.value;
                                    chartData[i] = returnedJson.results.bindings[i].count.value;
                                }
                            }

                            //  retrieve the chart id
                            var chartId = $("#" + (idx + 1) + "__chartid");
                            var chartColor = color_2;
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
                                    maintainAspectRatio: true,
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
                            // with operations
                            if (operations.length > 0) {
                                var label = [];
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    if (returnedJson.results.bindings[i].label.value == '') {
                                        label[i] = 'Unknown'
                                    } else {
                                        label[i] = returnedJson.results.bindings[i].label.value;
                                    }

                                }

                                operations.forEach(o => {
                                    var action = o
                                    if (action == 'count') {
                                        var param = 'label';
                                        // activate the operations on the data
                                        var elCount = eval(action + '(' + param + ')');
                                        // where I'll store the data necessary for the chart
                                        chartData = Object.values(elCount);
                                        chartLabels = Object.keys(elCount);
                                    }
                                })
                            } else if (operations.length == 0) {
                                // without operations
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    chartLabels[i] = returnedJson.results.bindings[i].label.value;
                                    chartData[i] = returnedJson.results.bindings[i].count.value;
                                }
                            }
                            //  retrieve the chart id
                            var chartId = $("#" + (idx + 1) + "__chartid");
                            var chartColor = color_2;
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
                                    maintainAspectRatio: true,
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
                        } else if (chart_type == 'doughnutchart') {
                            var chartData = [];
                            var chartLabels = [];

                            // with operations
                            if (operations.length > 0) {
                                var label = [];
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    if (returnedJson.results.bindings[i].label.value == '') {
                                        label[i] = 'Unknown'
                                    } else {
                                        label[i] = returnedJson.results.bindings[i].label.value;
                                    }

                                }

                                operations.forEach(o => {
                                    var action = o
                                    if (action == 'count') {
                                        var param = 'label';
                                        // activate the operations on the data
                                        var elCount = eval(action + '(' + param + ')');
                                        // where I'll store the data necessary for the chart
                                        chartData = Object.values(elCount);
                                        chartLabels = Object.keys(elCount);
                                    }
                                })
                            } else if (operations.length == 0) {
                                // without operations
                                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                                    chartData[i] = returnedJson.results.bindings[i].count.value;
                                    if (returnedJson.results.bindings[i].label.value == '') {
                                        chartLabels[i] = 'Unknown'
                                    } else {
                                        chartLabels[i] = returnedJson.results.bindings[i].label.value;
                                    }
                                }
                            }

                            // retrieve the chart id
                            var chartId = $("#" + (idx + 1) + "__chartid");
                            // chart colors
                            // Don't understand why, function chartColors can't be read. So I extracted the content and applied directly
                            // var chartColors = chartColor(color_1, color_2, chartLabels.length);
                            var chartColors = d3.quantize(d3.interpolateHcl(color_2, color_1), chartLabels.length);


                            // chart plotting
                            var myDoughnutChart = new Chart(chartId, {
                                type: 'doughnut',
                                data: {
                                    datasets: [{
                                        data: chartData,
                                        backgroundColor: chartColors
                                    }],

                                    labels: chartLabels
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: true,
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

                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        // $("#" + idx + "__chartid").text('There is an ' + xhr.statusText + 'in the query, check and try again.');
                        var c = document.getElementById((idx + 1) + "__chartid");
                        var p = document.createElement("p");
                        var error_text = document.createTextNode('There is an ' + xhr.statusText + ' in the query,\n check and try again.');
                        p.appendChild(error_text)
                        c.after(p);
                    }
                });
            }

            // textsearch
            else if (textsearch_query) {
                var encoded_textsearch = encodeURIComponent(textsearch_query);
                // empty the table with results
                $("#" + idx + "__textsearchid tr").detach();
            }
        });

    };
    update();
    $('form').change(update);
})

const addQueryArea = () => {
    console.log('check');
}

//// RELATIONS TEMPLATE FUNCTIONS ////

// text search
function perform_textsearch(elid, textsearch_query) {
    var q = document.getElementById(elid).value.toString();
    var pos = elid.split('__')[0].toString();
    var textsearch_query = document.getElementById(pos + '__textsearch_query').value;
    var textsearch_query = textsearch_query.replace('<<searchterm>>', q);
    var encoded_textsearch = encodeURIComponent(textsearch_query);
    var sparqlEndpoint = datastory_data.sparql_endpoint;

    // empty table and remove all previous searches
    $("#" + pos + "__textsearchid tr").detach();
    removeAllFrom(pos, parseInt(pos) + 1)

    // send the query
    $.ajax({
        type: 'GET',
        url: sparqlEndpoint + '?query=' + encoded_textsearch,
        headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
        success: function (returnedJson) {
            // lookup actions in the DOM
            var actions = getActionsFromInputs(pos);
            // create results table
            createResultsTable(returnedJson, actions, pos);
            $("#" + pos + "__textsearchid").show();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.statusText);
        }
    });

};

// add action buttons in the table of text search results
function addActionButton(actions, heading, table_pos, uri_or_text_value, text_value) {
    var actionsHTML = "";
    if (actions.length) {
        actions.forEach(function (el, index) {
            console.log(el);
            if (el.column == heading && el.column_2 == "") {
                // normal action
                actionsHTML += "<br/><span \
        onclick='performActionQuery(\""+ el.actionpos + "\",\"" + heading + "\",\"" + table_pos + "\", \"" + escape(encodeURIComponent(uri_or_text_value)) + "\", \"" + escape(encodeURIComponent(text_value)) + "\", \"" + encodeURIComponent(el.query) + "\", \"" + encodeURIComponent(el.title) + "\")' class='action_button' \
           >"+ el.title + "</span> ";
            } else {
                // combo action
                if (el.column == heading || el.column_2 == heading) {
                    var other_heading = compareStrings(heading, el.column, el.column_2);
                    actionsHTML += "<br/><span \
          onclick='performActionQuery(\""+ el.actionpos + "\",\
              \""+ heading + "\",\"" + table_pos + "\",\
              \""+ escape(encodeURIComponent(uri_or_text_value)) + "\",\
              \""+ escape(encodeURIComponent(text_value)) + "\", \
              \""+ encodeURIComponent(el.query) + "\", \
              \""+ encodeURIComponent(el.title) + "\", \
              \"True\", \""+ other_heading + "\", \"" + el.table_2 + "\")'\
              class='action_button'>"+ el.title + "</span> ";
                    console.log("combo button", other_heading, el.table_2);
                }
            }
        });
    }
    return actionsHTML;
};

// perform action buttons query and hide the table
function performActionQuery(actionpos, heading, table_pos, uri_or_text_value, text_value, encoded_query, action_title, combo = "False", heading_2 = "", table_2 = "") {

    var table_id = "#" + table_pos + "__textsearchid";
    uri_or_text_value = decodeURIComponent(unescape(uri_or_text_value));
    text_value = decodeURIComponent(unescape(text_value));

    // show button with selected value on top
    //manageSelectedValue(table_pos,table_id,text_value,datastory_data.color_code[0]);
    //toggleTable("#"+table_pos+"__textsearchid");
    collapseTable(table_pos + "__textsearchid")

    // decode query
    var decoded_query = decodeURIComponent(encoded_query);
    var reencoded_query = "";
    // replace in the query the column header with the value of the table cell
    var q = "";
    if (uri_or_text_value.includes('http')) { q = "<" + uri_or_text_value + ">"; }
    else { q = "\"" + uri_or_text_value + "\""; };
    var replaced_query = decoded_query.replace('<<' + heading + '>>', q);

    if (heading_2 == "") {
        var reencoded_query = encodeURIComponent(replaced_query);
    } else {
        var q2 = "";
        var other_field = $("#" + table_pos + "__selected_text_value").data('uri');
        if (other_field.includes('http')) { q2 = "<" + other_field + ">"; }
        else { q2 = "\"" + other_field + "\""; };
        replaced_query = replaced_query.replace('<<' + heading_2 + '>>', q2);
        var reencoded_query = encodeURIComponent(replaced_query);
        console.log("a combo!", q, q2, heading_2, table_2, replaced_query);
    }

    // send the query
    $.ajax({
        type: 'GET',
        url: datastory_data.sparql_endpoint + '?query=' + reencoded_query,
        headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
        beforeSend: function () { $('#loader').removeClass('hidden') },
        success: function (returnedJson) {
            // lookup actions in the DOM
            var actions = getActionsFromInputs(actionpos);
            // create the results table
            createResultsTable(returnedJson, actions, actionpos, table_pos, action_title, encodeURIComponent(text_value), encodeURIComponent(uri_or_text_value));

        },
        complete: function () { $('#loader').addClass('hidden') },
        error: function (xhr, ajaxOptions, thrownError) {
            return xhr.statusText;
        }
    });

};

// NOT USED manage buttons show result / selected value when performing an action
function manageSelectedValue(table_pos, table_id, text_value, color) {
    // show button to toggle/show the table
    // var show_btn = "<span class='show_table' \
    //   id='"+table_pos+"__textsearchid__show_table' \
    //   onclick='toggleTable(\""+table_id+"\")' \
    //   data-table='"+table_id+"'>Show results</span>";

    // selected value button
    var selected_button = "<span id='" + table_pos + "__selected_text_value' \
    style='background-color: "+ color + ";' \
    data-table='"+ table_id + "' \
    class='selected_text_value'\
    onclick='removeAllFrom("+ table_pos.toString() + "," + (parseInt(table_pos) + 1).toString() + ")'>" + text_value + "</span>";

    // var prev_show_button = document.getElementById(table_pos+"__textsearchid__show_table");
    // // add show results button
    // if ( prev_show_button === null) {
    //   $( show_btn ).insertBefore(table_id);
    // } ;

    // add selected value button
    $(selected_button).insertAfter(table_id);

    // toggle the table
    //$("#"+table_pos+"__textsearchid").hide();
};

function removeAllFrom(cur_num, next_num) {
    // detach current
    //var cur_el = document.querySelectorAll("[id*='"+cur_num+"__selected_text_value']");
    //if (cur_el != undefined) {cur_el.outerHTML = "";}
    // other elements: TODO in the future there may be more elements to detach
    //var list_selected_text_value = document.querySelectorAll("[id*=__selected_text_value]");
    var list_tables = document.querySelectorAll("[id*=__textsearchid]");
    var list_showtables = document.querySelectorAll("[id*=__textsearchid__show_table]");

    //cur_el.forEach(maybeDetach.bind(null, cur_num));
    //list_selected_text_value.forEach(maybeDetach.bind(null, next_num));
    list_tables.forEach(maybeDetach.bind(null, next_num));
    list_showtables.forEach(maybeDetach.bind(null, next_num));

    // show again the table
    //toggleTable("#"+cur_num+"__textsearchid");
}

function maybeDetach(next_num, el, index) {
    var cur_num = el.id.split('__')[0];
    if (parseInt(cur_num) >= parseInt(next_num)) {
        el.outerHTML = "";
    }
}

function toggleTable(table_id) {
    $(table_id).toggle();
}

function getActionsFromInputs(pos) {
    var inputs = document.getElementsByTagName('input');
    var actions = [];
    $('input').each(function (i) {
        var inputvalue = $(this).val();
        if (inputvalue.length && inputvalue === pos + '__textsearch_query') {
            var actiondata = {};
            var actionpos = this.id.split('__')[0];
            var actiontitle = $("#" + actionpos + "__tablevalueaction_title").val();
            var actionquery = $("#" + actionpos + '__tablevalueaction_query').val();
            var actiontable2 = $("#" + actionpos + '__tablevalueaction_table_2').val();
            var matches = actionquery.match(/<<([^)]+)>>/g);
            actiondata.title = actiontitle;
            actiondata.query = actionquery;
            actiondata.column = matches[0].replace("<<", "").replace(">>", "");
            actiondata.table_2 = "";
            if (actiontable2 && actiontable2.length) {
                var table_2_pos = document.querySelector('input[value="' + actiontable2 + '"]').id.split('__')[0];
                actiondata.table_2 = table_2_pos;
            }
            actiondata.column_2 = "";
            if (matches.length >= 2) { actiondata.column_2 = matches[1].replace("<<", "").replace(">>", ""); }
            actiondata.actionpos = actionpos;
            actions.push(actiondata);
            console.log(actionquery, matches, actions);
        }
    });
    return actions;
}

function createResultsTable(returnedJson, actions, pos, table_pos = pos, action_title = "search", text_value = "", uri_or_text_value = "") {
    var tabletoappend = "<caption class='resulttable_caption' \
  style='color: white'>"+ decodeURIComponent(action_title) + "\
  <span class='caret' onclick='collapseTable(\""+ pos + "__textsearchid\")'></span>\
  <span class='closetable' onclick='detachTable(\""+ pos + "__textsearchid\")'>x</span>\
  <br/><span id='"+ pos + "__selected_text_value' class='resulttable_caption_searchedvalue' data-uri='" + decodeURIComponent(uri_or_text_value) + "'>" + decodeURIComponent(text_value) + "</span>\
  </caption>\
  <tr>";
    // exclude headings with Label
    var headings = returnedJson.head.vars;
    for (j = 0; j < headings.length; j++) {
        if (!headings[j].includes('Label')) {
            tabletoappend += "<th>" + headings[j] + "</th>";
        } else {
            headings.splice(j, 1);
            j--;
        }
    }

    // format table
    tabletoappend += "</tr>";
    //if (returnedJson.length >= 1) {
    for (i = 0; i < returnedJson.results.bindings.length; i++) {
        tabletoappend += "<tr>";
        for (j = 0; j < headings.length; j++) {

            var res_value = "";
            if (returnedJson.results.bindings[i][headings[j]] !== undefined) {
                res_value = returnedJson.results.bindings[i][headings[j]].value;
            };

            if (returnedJson.results.bindings[i][headings[j] + 'Label'] != undefined) {
                var res_label = ""
                if (returnedJson.results.bindings[i][headings[j] + 'Label'].value.length) {
                    res_label = returnedJson.results.bindings[i][headings[j] + 'Label'].value;
                }
                tabletoappend += "<td>";
                tabletoappend += "<a class='table_result' href='" + res_value + "'>" + res_label + "</a>";
                var buttons = addActionButton(actions, headings[j], pos, res_value, res_label);
                tabletoappend += buttons + "</td>";
            }
            else {
                tabletoappend += "<td>";
                tabletoappend += "<span class='table_result'>" + res_value + "</span>";
                var buttons = addActionButton(actions, headings[j], pos, res_value, res_value);
                tabletoappend += buttons + "</td>";
            }
        }
        tabletoappend += "</tr>";
    }
    if (!$("#" + pos + "__textsearchid").length) {
        var new_table = "<table class='col-12' id='" + pos + "__textsearchid'>\
    "+ tabletoappend + "</table>";
        // WYSIWYG
        if (!$("#relation_datastory") === null) {
            $("#relation_datastory").append(new_table);
        } else {
            // preview
            var tables = document.getElementsByTagName('table');
            $(new_table).insertAfter(tables[tables.length - 1]);
        }

    } else {
        $("#" + pos + "__textsearchid tr").detach();
        $("#" + pos + "__textsearchid").append(tabletoappend);
    }

}

function collapseTable(table_id) { $("#" + table_id + " tr").toggle(); }

function detachTable(table_id) { $("#" + table_id + " tr," + "#" + table_id + " caption").remove(); }

function compareStrings(heading, str1, str2) {
    // return the different string
    if (heading == str1) { return str2 } else { return str1 };
}

//// STATISTICS TEMPLATE FUNCTIONS ////

function colorSwitch(color_1, color_2) {
    // gradient
    // var gradientEl = document.querySelector(".panel-header");
    // gradientEl.classList.remove("bg-primary-gradient");
    // gradientEl.style.background = 'linear-gradient(-45deg,' + color_1 + ',' + color_2 + ')';
    var gradientEl = document.querySelector(".secondarymenuinner");
    var gradientPreview = document.querySelectorAll(".previewtextsearch");
    var counters = document.querySelectorAll(".count_result");
    //var textsearch_buttons = document.querySelectorAll(".textsearch_button");
    //gradientEl.classList.remove("bg-primary-gradient");
    if (typeof (gradientEl) != undefined && gradientEl != null) { gradientEl.style.background = 'linear-gradient(-45deg,' + color_1 + ',' + color_2 + ')'; }

    function gradientbackground(el) {
        el.style.background = 'linear-gradient(-45deg,' + color_1 + ',' + color_2 + ')';
    }
    if (typeof (gradientPreview) != undefined && gradientPreview != null) {
        gradientPreview.forEach(gradientbackground);
    }

    function borders(el) {
        el.style.border = "solid 2px " + color_1;
        el.style.color = color_1;
    }
    counters.forEach(borders);

}

// show counters in the final data story
function queryCounter() {
    if (datastory_data.dynamic_elements) {
        datastory_data.dynamic_elements.forEach(element => {
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
                    var sparqlEndpoint = datastory_data.sparql_endpoint;
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
                                var numP = document.createElement("p");
                                numP.appendChild(document.createTextNode(count));
                                numP.className = 'counter_num';
                                countDiv.appendChild(numP);
                                // create and append p for label
                                var labelP = document.createElement("p");
                                labelP.appendChild(document.createTextNode(count_label));
                                labelP.className = 'counter_label';
                                countDiv.appendChild(labelP);
                                generalDiv.appendChild(countDiv);
                                colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]);
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
    if (datastory_data.dynamic_elements) {
        datastory_data.dynamic_elements.forEach(element => {
            if (element.type === 'chart') {
                var chart = element.chart_type;
                if (chart === "barchart") {
                    barchart(element);
                } else if (chart === "linechart") {
                    linechart(element);
                } else if (chart === "doughnutchart") {
                    doughnutchart(element);
                }
                else if (chart === 'scatterplot') {
                    scatterplot(element);
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

// print chart
function printChart(image, position) {
    var print_btn = document.getElementById('print_' + position);
    print_btn.onclick = function () {
        print_btn.href = image;
        print_btn.download = 'my_chart.png';
    }
}

// array to string with quotes
function arrayToString(labelsArray) {
    var labelsString = '';
    labelsArray.forEach(el => {
        var newString = '"' + el + '",';
        labelsString = labelsString + newString;
    }); return labelsString
}

// create embed tag with image source
function exportChart(position, type, labels, data, label) {
    var export_btn = document.getElementById('export_' + position);
    export_btn.onclick = function () {
        var chartURL = 'https://quickchart.io/chart?c={type:"' + type + '",data:{labels:[' + labels + '],datasets:[{label:"' + label + '",data:[' + data + ']}]}}'
        // window.open(chartURL);
        window.prompt("Copy to clipboard: Ctrl+C, Enter", '<embed type="image/jpg" src="' + encodeURI(chartURL) + '">');
    }
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
        var sparqlEndpoint = datastory_data.sparql_endpoint;
        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                // check if query requires operations
                var op = element.operations;
                if (op.length > 0) {
                    var label = [];
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        if (returnedJson.results.bindings[i].label.value == '') {
                            label[i] = 'Unknown'
                        } else {
                            label[i] = returnedJson.results.bindings[i].label.value;
                        }

                    }

                    op.forEach(o => {
                        var action = o.action;
                        var param = o.param;
                        // activate the operations on the data
                        if (action.includes('count')) {
                            var elCount = eval(action + '(' + param + ')');
                            // where I'll store the data necessary for the chart
                            chartData = Object.values(elCount);
                            chartLabels = Object.keys(elCount);
                        }
                    })
                } else if (op.length == 0) {
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        chartLabels[i] = returnedJson.results.bindings[i].label.value;
                        chartData[i] = returnedJson.results.bindings[i].count.value;
                    }
                }

                //  create the HTML structure that'll receive the data
                chartHTMLElements(element);
                //  retrieve the chart id
                var chartId = "chart_" + element.position;
                // set colors
                var chartColor = datastory_data.color_code[0];
                // create image string
                var image = '';
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
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                        animation: {
                            onComplete: function () {
                                image = myBarChart.toBase64Image();
                                printChart(image, element.position);
                                labels = arrayToString(chartLabels);
                                exportChart(element.position, 'bar', labels, chartData, 'Quantity');
                            }
                        }
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
        var sparqlEndpoint = datastory_data.sparql_endpoint;
        // var label = element.label;
        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                // check if query requires operations
                var op = element.operations;
                if (op.length > 0) {
                    var label = [];
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        if (returnedJson.results.bindings[i].label.value == '') {
                            label[i] = 'Unknown'
                        } else {
                            label[i] = returnedJson.results.bindings[i].label.value;
                        }

                    }

                    op.forEach(o => {
                        var action = o.action;
                        var param = o.param;
                        // activate the operations on the data
                        if (action.includes('count')) {
                            var elCount = eval(action + '(' + param + ')');
                            // where I'll store the data necessary for the chart
                            chartData = Object.values(elCount);
                            chartLabels = Object.keys(elCount);
                        }
                    })
                } else if (op.length == 0) {
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        chartLabels[i] = returnedJson.results.bindings[i].label.value;
                        chartData[i] = returnedJson.results.bindings[i].count.value;
                    }
                }

                //  create the HTML structure that'll receive the data
                chartHTMLElements(element);
                //  retrieve the chart id
                var chartId = "chart_" + element.position;
                var chartColor = datastory_data.color_code[0];
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
                        maintainAspectRatio: true,
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
                        },
                        animation: {
                            onComplete: function () {
                                image = myLineChart.toBase64Image();
                                printChart(image, element.position);
                                labels = arrayToString(chartLabels);
                                exportChart(element.position, 'line', labels, chartData, 'New Entries');
                            }
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
        var sparqlEndpoint = datastory_data.sparql_endpoint;

        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {

                var chartData = [];
                var chartLabels = [];

                // check if query requires operations
                var op = element.operations;
                if (op.length > 0) {
                    var label = [];
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        if (returnedJson.results.bindings[i].label.value == '') {
                            label[i] = 'Unknown'
                        } else {
                            label[i] = returnedJson.results.bindings[i].label.value;
                        }

                    }

                    op.forEach(o => {
                        var action = o.action;
                        var param = o.param;
                        // activate the operations on the data
                        if (action.includes('count')) {
                            var elCount = eval(action + '(' + param + ')');
                            // where I'll store the data necessary for the chart
                            chartData = Object.values(elCount);
                            chartLabels = Object.keys(elCount);
                        }
                    })
                } else if (op.length == 0) {
                    for (i = 0; i < returnedJson.results.bindings.length; i++) {
                        chartData[i] = returnedJson.results.bindings[i].count.value;
                        if (returnedJson.results.bindings[i].label.value == '') {
                            chartLabels[i] = 'Unknown'
                        } else {
                            chartLabels[i] = returnedJson.results.bindings[i].label.value;
                        }
                    }
                }

                // create the HTML structure that'll receive the data
                chartHTMLElements(element);
                // retrieve the chart id
                var chartId = "chart_" + element.position;

                // chart colors
                var colors = chartColor(datastory_data.color_code[0], datastory_data.color_code[1], chartLabels.length);

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
                        maintainAspectRatio: true,
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
                        },
                        animation: {
                            onComplete: function () {
                                image = myDoughnutChart.toBase64Image();
                                printChart(image, element.position);
                                labels = arrayToString(chartLabels);
                                exportChart(element.position, 'doughnut', labels, chartData);
                            }
                        }
                    }
                });
            }
        })
    }

}

function scatterplot(element) {
    let queryArray = [];

    // check if chart requires extra queries
    var extra = element.extra_queries;
    if (extra.length == 0) {
        // where I'll store the data necessary fo the scatter plot
        let chartData = [];
        let tempLabels = [];

        let query = element.chart_query;
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
            var sparqlEndpoint = datastory_data.sparql_endpoint;
            $.ajax({
                type: 'GET',
                url: sparqlEndpoint + '?query=' + encoded,
                headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                success: function (returnedJson) {
                    const queryResults = returnedJson.results.bindings;
                    for (entry in queryResults) {
                        const xValue = parseInt(queryResults[entry].x.value);
                        const yValue = parseInt(queryResults[entry].y.value);
                        const entryObj = { x: xValue, y: yValue }
                        tempLabels.push(xValue);
                        chartData.push(entryObj);
                    }

                    //  create the HTML structure that'll receive the data
                    chartHTMLElements(element);
                    //  retrieve the chart id
                    var chartId = "chart_" + element.position;
                    var chartColor = datastory_data.color_code[0];
                    // graph plotting
                    var myScatterChart = new Chart(chartId, {
                        type: 'scatter',
                        data: {
                            datasets: [{
                                label: element.chart_series,
                                data: chartData,
                                backgroundColor: chartColor
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: true,
                                    text: element.chart_title
                                }
                            },
                            animation: {
                                onComplete: function () {
                                    image = myScatterChart.toBase64Image();
                                    printChart(image, element.position);
                                    exportChart(element.position, 'scatter', chartData);
                                }
                            }
                        }
                    });
                }
            })
        }
    } else if (extra.length > 0) {
        let query = element.chart_query;
        let seriesArray = [];
        let datasetArray = [];
        queryArray.push(query);
        seriesArray.push(element.chart_series);

        for (const e of extra) {
            queryArray.push(e.extra_query);
            seriesArray.push(e.extra_series);
        }
        // generate colors based on number of queries
        var colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), queryArray.length);

        for (const [i, q] of queryArray.entries()) {
            let chart_query = q;
            let chartData = [];
            let dataDict = {};

            // check if the query is an API request
            if (chart_query.startsWith('http')) {
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
                var encoded = encodeURIComponent(chart_query);
                var sparqlEndpoint = datastory_data.sparql_endpoint;
                $.ajax({
                    type: 'GET',
                    url: sparqlEndpoint + '?query=' + encoded,
                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                    success: function (returnedJson) {
                        const queryResults = returnedJson.results.bindings;
                        for (entry in queryResults) {
                            const xValue = parseInt(queryResults[entry].x.value);
                            const yValue = parseInt(queryResults[entry].y.value);
                            const entryObj = { x: xValue, y: yValue }
                            chartData.push(entryObj);
                        }
                        dataDict.data = chartData;
                        dataDict.label = seriesArray[i];
                        dataDict.backgroundColor = colors[i];
                        datasetArray.push(dataDict);
                        myScatterChart.update();
                    }
                });
            }
        }

        //  create the HTML structure that'll receive the data
        chartHTMLElements(element);
        //  retrieve the chart id
        var chartId = "chart_" + element.position;

        // graph plotting
        var myScatterChart = new Chart(chartId, {
            type: 'scatter',
            data: data = {
                datasets: datasetArray
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: element.chart_title
                    }
                },
                animation: {
                    onComplete: function () {
                        image = myScatterChart.toBase64Image();
                        printChart(image, element.position);
                        exportChart(element.position, 'scatter', datasetArray);
                    }
                }
            }
        });
    }
}

// function stacked_barchart(element) {

//     // get the data that I need
//     // now starts a piece of code that is exactly the same from function counter
//     // ********


//     var query = element.chart_query;
//     // check if the query is an API request
//     if (query.startsWith('http')) {
//         alert('There is an API request.');
//         // $.ajax({
//         //     type: 'GET',
//         //     url: query,
//         //     headers: {Accept: 'application/json'},
//         //     success: function (returnedJson) {
//         //         do things
//         //     }
//         // }
//     } else {
//         // if it is a sparql query
//         var encoded = encodeURIComponent(query);
//         var sparqlEndpoint = datastory_data.sparql_endpoint;

//         $.ajax({
//             type: 'GET',
//             url: sparqlEndpoint + '?query=' + encoded,
//             headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
//             success: function (returnedJson) {

//                 const dataElements = [];
//                 for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                     // dataElements[i] = returnedJson.results.bindings[i].label.value;
//                 }

//                 if (element.operations == 'count') {
//                     // elCount = count(dataElements);
//                 }

//                 // where I'll store the data necessary fo the bar chart
//                 // var chartData = Object.values(elCount);
//                 // var chartLabels = Object.keys(elCount);

//                 // create the HTML structure that'll receive the data
//                 chartHTMLElements(element);
//                 // retrieve the chart id
//                 var chartId = "chart_" + element.position;

//                 // chart colors
//                 // var colors = chartColor(data.color_code[0], data.color_code[1], chartLabels.length);

//                 // chart plotting
//                 var myMultipleBarChart = new Chart(chartId, {
//                     type: 'bar',
//                     data: {
//                         labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
//                         datasets: [{
//                             // label: "First time visitors",
//                             // backgroundColor: '#59d05d',
//                             // borderColor: '#59d05d',
//                             // data: [95, 100, 112, 101, 144, 159, 178, 156, 188, 190, 210, 245],
//                         }, {
//                             // label: "Visitors",
//                             // backgroundColor: '#fdaf4b',
//                             // borderColor: '#fdaf4b',
//                             // data: [145, 256, 244, 233, 210, 279, 287, 253, 287, 299, 312, 356],
//                         }, {
//                             // label: "Pageview",
//                             // backgroundColor: '#177dff',
//                             // borderColor: '#177dff',
//                             // data: [185, 279, 273, 287, 234, 312, 322, 286, 301, 320, 346, 399],
//                         }],
//                     },
//                     options: {
//                         responsive: true,
//                         maintainAspectRatio: true,
//                         legend: {
//                             position: 'bottom'
//                         },
//                         // title: {
//                         //     display: true,
//                         //     text: 'Traffic Stats'
//                         // },
//                         tooltips: {
//                             mode: 'index',
//                             intersect: false
//                         },
//                         responsive: true,
//                         scales: {
//                             xAxes: [{
//                                 stacked: true,
//                             }],
//                             yAxes: [{
//                                 stacked: true
//                             }]
//                         }
//                     }
//                 });
//             }
//         })
//     }

// }

// autoresize textarea
function auto_grow(element) {
    // element.style.height = "5px";
    // element.style.height = (element.scrollHeight)+"px";
}

function getPDF(elem_id) {
    var element = document.getElementById(elem_id);
    var opt = {
        margin: 1,
        filename: 'story.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1 },
        pagebreak: { mode: 'avoid-all', after: 'pagebreak' },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    html2pdf(element, opt);
}

function getHTML(el) {
    var html = document.documentElement.outerHTML;
    var htmlcopy = html.replaceAll('/static', 'static');

    // remove elements
    // var div = document.createElement('div');
    // div.innerHTML = htmlcopy;
    // var elements = div.getElementsByClassName('sidebar');
    // while (elements[0])
    //   elements[0].parentNode.removeChild(elements[0])
    // var elements2 = div.getElementsByClassName('main-header');
    // while (elements2[0])
    //   elements2[0].parentNode.removeChild(elements2[0])

    // reassemble html
    //var repl = div.innerHTML;
    // download html and zip file
    var thishtml = encodeURIComponent(htmlcopy);
    el.href = 'data:text/html;charset=UTF-8,' + thishtml;
    window.open('../static/static.zip');
}

function saveHTML(name) {
    var html = document.documentElement.outerHTML;
    var htmlcopy = html.replaceAll('/static', 'static');
    var thishtml = encodeURIComponent(htmlcopy);
    saveAs(thishtml, name + '.html');
}

// change color of secondary menu in datastory
function getBrightness(c) {
    var c = c.substring(1);      // strip #
    var rgb = parseInt(c, 16);   // convert rrggbb to decimal
    var r = (rgb >> 16) & 0xff;  // extract red
    var g = (rgb >> 8) & 0xff;  // extract green
    var b = (rgb >> 0) & 0xff;  // extract blue
    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    var nodes = document.getElementById('secondarymenuinner').children;
    for (var i = 0; i < nodes.length; i++) {
        if (luma < 45) {
            nodes[i].setAttribute('style', 'color:#ffffff !important');
            $('.exportbutton').css('border', 'solid 1px #ffffff');
        } else {
            nodes[i].setAttribute('style', 'color: black !important');
        }

        for (var j = 0; j < nodes[i].children.length; j++) {
            if (luma < 45) {
                nodes[i].children[j].setAttribute('style', 'color:#ffffff !important');
            } else { nodes[i].children[j].setAttribute('style', 'color: black !important'); }
        }
    };

}

async function fillDropDownList(storyList) {
    const name = storyList.getAttribute('name');
    try {
        const response = await fetch('https://raw.githubusercontent.com/melody-data/stories/main/published_stories/stories_list.json');
        const data = await response.json();
        for (story of data) {
            if (name === story.user_name) {
                storyList.appendChild(newListElement(story.title, story.id))
            }
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

const newListElement = (title, id) => {
    const a = document.createElement('a');
    const text = title;
    const aContent = document.createTextNode(text);
    let file_name = title.replace(/[^\w]/g, '_').toLowerCase();
    a.setAttribute('class', 'dropdown-item');
    a.setAttribute('href', 'modify/' + id + '/' + file_name);
    a.appendChild(aContent);
    return a;
}