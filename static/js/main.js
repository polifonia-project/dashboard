var checked_filters;
var markers;
var allMarkers;
var sidebar, map;
var myScatterChart;
addEventListener("DOMContentLoaded", function () {
    if (Object.getOwnPropertyNames(datastory_data).length > 0) { colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]); }
});

window.onload = function () {
    //if (Object.getOwnPropertyNames(datastory_data).length > 0) { queryCounter(); }
    //chartViz();
    disableKeypress();
    saveHTML(datastory_data.name);
    var map_ready;
}

// disable selection of templates other than statistics
$(document).ready(function () {
    //$("#exampleFormControlSelect1 option[value='statistics']").removeAttr('disabled');
    $(".navbar-toggler.sidenav-toggler.ml-auto").attr('aria-expanded', 'false');
    if (Object.getOwnPropertyNames(datastory_data).length > 0) {
        getBrightness(datastory_data.color_code[1]);
    }

    var form = document.querySelector('form');
    if (form != undefined) {
        form.addEventListener('change', function (e) {
            var map_chechbox = $(this).find('input[class="map_chechbox"]');
            if (map_chechbox != undefined) {
                e.preventDefault();
                checked_filters = Array.from(document.querySelectorAll('input[class="map_chechbox"]:checked'));
                addRemoveMarkers(checked_filters);
            }
        });

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
// function updateindex() {
//     $('#sortable [id$="block_field"]').each(function () {
//         var idx = $('[id$="block_field"]').index(this) + 1;
//         $(this).attr("id", idx + '__block_field');
//         var everyChild = this.getElementsByTagName("*");
//         for (var i = 0; i < everyChild.length; i++) {
//             var childid = everyChild[i].id;
//             var childname = everyChild[i].name;
//             var childhref = everyChild[i].href;
//             var childdataid = everyChild[i].dataset.id;
//             if (childid != undefined && !childid.includes('_panel') && !childid.includes('ham')) {
//                 if (!isNaN(+childid.charAt(0))) { everyChild[i].id = idx + '__' + childid.split(/__(.+)/)[1] }
//                 else { everyChild[i].id = idx + '__' + childid; }
//             };
//             if (childname != undefined && !'map_filter') {
//                 if (!isNaN(+childname.charAt(0))) { everyChild[i].name = idx + '__' + childname.split(/__(.+)/)[1] }
//                 else { everyChild[i].name = idx + '__' + childname; }
//             };
//             if (childdataid != undefined) {
//                 if (!isNaN(+childdataid.charAt(0))) { everyChild[i].dataset.id = idx + '__' + childdataid.split(/__(.+)/)[1] }
//                 else { everyChild[i].dataset.id = idx + '__' + childdataid; }
//             };
//         };
//     });
// };

// move blocks up/down when clicking on arrow and delete with trash
// down function
// $("#sortable").on('click', "a[id$='down']", function (e) {
//     e.preventDefault();
//     var numrow = parseInt(this.id.split('__')[0], 10),
//         nr = 1,
//         current = $("#" + numrow + "__block_field"),
//         next = current.next();
//
//     if (next.length) {// if there's row after one that was clicked
//         current.insertAfter(next);
//     }
//     updateindex();
//
//     // up function
// }).on('click', "a[id$='up']", function (e) {
//     e.preventDefault();
//
//     var numrow = parseInt(this.id.split('__')[0], 10),
//         nr = 1,
//         current = $("#" + numrow + "__block_field"),
//         prev = current.prev();
//
//     if (prev.length) {
//         current.insertBefore(prev);
//     }
//     updateindex();
//
//     // delete function
// }).on('click', "a[id$='trash']", function (e) {
//     e.preventDefault();
//     $(this).parent().remove();
//     updateindex();
// });

// remove add map after click or if any map is already available
//$("a[name='map']").on('click', function () { $(this).detach(); });
//if ($("#1__map_points_query") != undefined) { $("a[name='map']").detach(); }

// add box
var counter = 0;
// function add_field(name, bind_query_id = "") {
//     updateindex();
//     var contents = "";
//
//     var text_field = "<input name='" + (counter + 1) + "__text' type='hidden' id='" + (counter + 1) + "__text' value=''>\
//     <div class='editor' id='" + (counter + 1) + "__editor'></div>"
//
//     var count_field = "<br><div class='card-body justify-content-center option-2b count_result  col-md-4'><p class='counter_num' id='" + (counter + 1) + "__num'></p><p class='counter_label' id='" + (counter + 1) + "__lab'></p></div><textarea name='" + (counter + 1) + "__count_query' type='text' id='" + (counter + 1) + "__count_query' rows='3' placeholder='Write the SPARQL query for the count.' required></textarea><input name='" + (counter + 1) + "__count_label' type='text' id='" + (counter + 1) + "__count_label' placeholder='The label you want to show.' required>";
//     var help = 'True';
//
//     var chart_field = "<div class='chart-container'>\
// 			<canvas id='" + (counter + 1) + "__chartid'></canvas>\
// 			</div>\
// 			<div class='form-group' id='" + (counter + 1) + "__form_group'>\
// 				<label for='exampleFormControlSelect2'>Chart Type</label>\
// 				<select name='" + (counter + 1) + "__chart_type' class='form-control' id='" + (counter + 1) + "__chart_type'>\
// 					<option name='" + (counter + 1) + "__linechart' id='" + (counter + 1) + "__linechart'>linechart</option>\
// 					<option name='" + (counter + 1) + "__barchart' id='" + (counter + 1) + "__barchart'>barchart</option>\
// 					<option name='" + (counter + 1) + "__doughnutchart' id='" + (counter + 1) + "__doughnutchart'>doughnutchart</option>\
// 					<option name='" + (counter + 1) + "__scatterplot' id='" + (counter + 1) + "__scatterplot'>scatterplot</option>\
// 				</select>\
//                 <a href='#' class='form-text' role='button' data-toggle='modal' data-target='#chartsModalLong'>Discover more about query and charts.</a><br/>\
// 				<label for='largeInput'>SPARQL query</label><br/>\
// 				<textarea oninput='auto_grow(this)' name='" + (counter + 1) + "__chart_query' type='text' id='" + (counter + 1) + "__chart_query' placeholder='Type your query' rows='3' required></textarea><br/>\
// 				<input style='display: block;' class='form-control' type='text' name='" + (counter + 1) + "__chart_series' id='" + (counter + 1) + "__chart_series' placeholder='The label for the data series'><br/>\
// 				<a id='query-btn' style='display: none;' class='btn btn-primary btn-border' extra='True' onclick='add_field(name)' name='query-btn'>Add another query</a>\
// 				<div class='form-group row' id='" + (counter + 1) + "__axes_label' style='display: flex;'><div class='col-6'>\
//                 <label>x label</label>\
//                 <input name='" + (counter + 1) + "__chart_label_x' type='text' id='" + (counter + 1) + "__chart_label_x' placeholder='The label for the x axis'></div>\
//                 <div class='col-6'>\
//                 <label>y label</label>\
//                 <input name='" + (counter + 1) + "__chart_label_y' type='text' id='" + (counter + 1) + "__chart_label_y' placeholder='The label for the y axis'>\
//                 </div> </div>\
//                 <label for='largeInput'>Chart Title</label><br/>\
// 				<input name='" + (counter + 1) + "__chart_title' type='text' class='form-control' id='" + (counter + 1) + "__chart_title' placeholder='Title' required><br/>\
// 				<br/><label>Operations</label><br/>\
// 				<input type='checkbox' id='count' name='" + (counter + 1) + "action1' value='count'>\
// 				<label for='count'>Count</label><br/>\
// 				<input type='checkbox' id='sort' name='" + (counter + 1) + "action2' value='sort'>\
// 				<label for='count'>Sort</label><br/>\
// 				</div>";
//
//     var simple_table_field = "<table class='col-12' id='" + (counter + 1) + "__table'></table>\
//             <div class='form-group'>\
//                 <label for='" + (counter + 1) + "__table_title'>Table title</label>\
//                 <input name='" + (counter + 1) + "__table_title' type='text' id='" + (counter + 1) + "__table_title' placeholder='The title of your table' required></div>\
//             <div class='form-group'>\
//                 <label for='" + (counter + 1) + "__table_query'>SPARQL query</label>\
//                 <textarea spellcheck='false' oninput='auto_grow(this)' name='" + (counter + 1) + "__table_query' type='text' id='" + (counter + 1) + "__table_query' placeholder='The query for your table results' required></textarea>\
//             </div></div>";
//
//     var text_search_field = "\
// 		<input class='textsearch_title' id='" + (counter + 1).toString() + "__textsearch_title' type='text' name='" + (counter + 1).toString() + "__textsearch_title' placeholder='A title, e.g. Search tunes'>\
// 		<textarea class='addplaceholder_textsearch' \
// 			oninput='auto_grow(this)' \
// 			name='" + (counter + 1) + "__textsearch_query' \
// 			type='text' \
// 			id='" + (counter + 1) + "__textsearch_query' \
// 			rows='6' required></textarea>\
// 		<div class='table-container textsearch_result'>\
// 			<div class='previewtextsearch col-4' style='background-image: linear-gradient(-45deg, "+ datastory_data.color_code[0] + ", " + datastory_data.color_code[1] + ";'>\
// 				<input class='textsearch_userinput modifydatastory' id='" + (counter + 1).toString() + "__textsearch_userinput' type='text' name='" + (counter + 1).toString() + "__textsearch_userinput' value=''>\
// 				<a id='" + (counter + 1).toString() + "__textsearch_button' class='textsearch_button' onclick='perform_textsearch(\"" + (counter + 1).toString() + "__textsearch_userinput\")' name='" + (counter + 1).toString() + "__textsearch'>Search</a>\
// 			</div>\
// 			<table class='col-12' id='" + (counter + 1).toString() + "__textsearchid'>\
// 				<!-- TODO add rows-->\
// 			</table>\
// 		</div>\
// 		<h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle' class='text-white'>Do you want to add an action to your results?</h4>\
// 		<p>Row values can be subject of new queries and return tables or charts. For each action a button will appear in the table.</p>\
// 		<a class='btn btn-primary btn-border' \
// 				onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
// 				name='tablevalueaction'>Add\
// 				action to results</a>";
//
//     var tablevalueaction_field = "\
// 		<input class='tablevalueaction_title' \
// 			id='" + (counter + 1).toString() + "__tablevalueaction_title' \
// 			type='text' \
// 			name='" + (counter + 1).toString() + "__tablevalueaction_title' \
// 			placeholder='A title, e.g. Show similar tunes'>\
// 		<input class='tablevalueaction_column' \
// 			id='" + (counter + 1).toString() + "__tablevalueaction_column' \
// 			type='text' \
// 			name='" + (counter + 1).toString() + "__tablevalueaction_column' \
// 			placeholder='The name of the column'>\
// 		<input class='tablevalueaction_table' \
// 			id='" + (counter + 1).toString() + "__tablevalueaction_table' \
// 			type='hidden' \
// 			name='" + (counter + 1).toString() + "__tablevalueaction_table' \
// 			value='"+ bind_query_id + "'>\
// 		<textarea class='addplaceholder_tablevalueaction'  \
// 			oninput='auto_grow(this)' \
// 			name='" + (counter + 1) + "__tablevalueaction_query' \
// 			type='text' \
// 			id='" + (counter + 1) + "__tablevalueaction_query' \
// 			rows='6' required></textarea>\
// 		<p><em>Type your query and perform a new search above to see the result</em></p>\
// 		<h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle' class='text-white'>Do you want to add an action to your results?</h4>\
// 		<p>Row values can be subject of new queries and return tables or charts. \
// 		For each action a button will appear in the table. You can also combine value results of this action with value results of a prior action or search.</p>\
// 		<a class='btn btn-primary btn-border' \
// 				onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
// 				name='tablevalueaction'>Add\
// 				action to results</a>\
// 		<a class='btn btn-primary btn-border' \
// 				onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
// 				name='tablecomboaction'>\
// 				Combine value results</a>";
//
//     var tablecomboaction_field = "\
// 		<input class='tablevalueaction_title' \
// 				id='" + (counter + 1).toString() + "__tablevalueaction_title' type='text' \
// 				name='" + (counter + 1).toString() + "__tablevalueaction_title' \
// 				placeholder='A title, e.g. Show tunes in common'>\
// 		<input class='tablevalueaction_table' \
// 			id='" + (counter + 1).toString() + "__tablevalueaction_table' \
// 			type='hidden' \
// 			name='" + (counter + 1).toString() + "__tablevalueaction_table' \
// 			value='"+ bind_query_id + "'>\
// 		<input class='tablevalueaction_column' \
// 				id='" + (counter + 1).toString() + "__tablevalueaction_column' type='text' \
// 				name='" + (counter + 1).toString() + "__tablevalueaction_column' \
// 				placeholder='The name of the column to combine'>\
// 		<input class='tablevalueaction_column' \
// 				id='" + (counter + 1).toString() + "__tablevalueaction_table_2' type='text' \
// 				name='" + (counter + 1).toString() + "__tablevalueaction_table_2' \
// 				placeholder='The name of other table to combine'>\
// 		<input class='tablevalueaction_column' \
// 				id='" + (counter + 1).toString() + "__tablevalueaction_column_2' type='text' \
// 				name='" + (counter + 1).toString() + "__tablevalueaction_column_2' \
// 				placeholder='The name of the column to combine'>\
// 		<textarea class='addplaceholder_tablecomboaction' \
// 				oninput='auto_grow(this)' \
// 				name='" + (counter + 1) + "__tablecomboaction_query' type='text' \
// 				id='" + (counter + 1) + "__tablecomboaction_query' \
// 				rows='6' required></textarea>\
// 		<p><em>Type your query and perform a new search above to see the result</em></p>\
// 		<h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle'\
// 				class='text-white'>Do you want to add an action to your results?</h4>\
// 		<p>Row values can be subject of new queries and return tables or charts. \
// 		For each action a button will appear in the table. You can also combine results of this \
// 		action with results of a prior action or search.</p>\
// 		<a class='btn btn-primary btn-border' \
// 				onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
// 				name='tablevalueaction'>Add\
// 				action to results</a>\
// 		<a class='btn btn-primary btn-border' \
// 				onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
// 				name='tablecomboaction'>\
// 				Combine results</a>";
//
//     var map_field = "<input class='map_title' id='" + (counter + 1) + "__map_title' type='text'\
// 				name='"+ (counter + 1) + "__map_title'\
// 				placeholder='The title of the map'>\
// 			<!-- data points -->\
// 			<textarea class='addplaceholder_points' oninput='auto_grow(this)'\
// 					name='"+ (counter + 1) + "__map_points_query' type='text'\
// 					id='"+ (counter + 1) + "__map_points_query' rows='10'\
// 					required></textarea>\
// 			<a onclick='rerunQuery(\""+ (counter + 1).toString() + "\",this)' \
// 					data-id='"+ (counter + 1).toString() + "__rerun_query' \
// 					data-run='true' href='#'>Rerun the query</a>\
// 			<!-- map preview -->\
// 			<div class='map_preview_container' id='"+ (counter + 1).toString() + "__map_preview_container'>\
// 			</div>\
// 			<script>var map = initMap("+ (counter + 1).toString() + ");</script>\
// 			<h4 id='" + (counter + 1).toString() + "__addmapfilter' class='text-white'>Do you want to add a filter to the map?</h4>\
// 			<p>Filters appear on the left side of the map and allow you to filter out points on the map based on a SPARQL query.</p>\
// 			<a class='btn btn-primary btn-border' \
// 					onclick='add_field(name,\"" + (counter + 1).toString() + "__map_points_query\")' \
// 					name='map_filter'>Add filter</a>";
//
//     var map_filter = "<input class='map_filter_title' \
// 				id='"+ (counter + 1) + "__map_filter_title' type='text'\
// 				name='"+ (counter + 1) + "__map_filter_title'\
// 				placeholder='The title of the filter'>\
// 		<input class='map_filter_bind_query' \
// 					id='" + (counter + 1).toString() + "__map_filter_bind_query' \
// 					type='hidden' \
// 					name='" + (counter + 1).toString() + "__map_filter_bind_query' \
// 					value='"+ bind_query_id + "'>\
// 		<textarea class='addplaceholder_mapfilter' oninput='auto_grow(this)'\
// 				name='"+ (counter + 1) + "__map_filter_query' type='text'\
// 				data-bind-query='"+ bind_query_id + "'\
// 				id='"+ (counter + 1) + "__map_filter_query' rows='6'\
// 				required></textarea>\
// 				<p>Rerun the query to add the filter to the map</p>";
//
//     var up_down = '<a href="#" class="up" id="' + (counter + 1) + '__up" name="' + (counter + 1) + '__up"><i class="fas fa-arrow-up" id="' + (counter + 1) + '__arrow-up"></i></a> \
// 		<a href="#" class="down" id="' + (counter + 1) + '__down" name="' + (counter + 1) + '__down"><i class="fas fa-arrow-down" id="' + (counter + 1) + '__arrow-down"></i></a> \
// 		<a href="#" class="trash" id="' + (counter + 1) + '__trash" name="' + (counter + 1) + '__trash"><i class="far fa-trash-alt" id="' + (counter + 1) + '__bin"></i></a><br/>';
//     var no_up_down = '<a href="#" class="trash" id="' + (counter + 1) + '__trash" name="' + (counter + 1) + '__trash"><i class="far fa-trash-alt" id="' + (counter + 1) + '__bin"></i></a><br/>';
//
//
//     if (name == 'textbox') {
//         var open_addons = "<div id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add text</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + text_field + close_addons;
//     } else if (name == 'countbox') {
//         var open_addons = "<div class='col' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add counter</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + count_field + close_addons;
//     } else if (name == 'chart_box') {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add chart</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + chart_field + close_addons;
//     } else if (name == 'table_box') {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add table</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + simple_table_field + close_addons;
//     } else if (name == 'textsearch') {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add text search</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + text_search_field + close_addons;
//     } else if (name.includes('tablevalueaction')) {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'>  <h4 class='block_title'>Add action</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + no_up_down + tablevalueaction_field + close_addons;
//     } else if (name.includes('tablecomboaction')) {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'>  <h4 class='block_title'>Combine results</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + no_up_down + tablecomboaction_field + close_addons;
//     } else if (name == 'map') {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add map</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + no_up_down + map_field + close_addons;
//     } else if (name == 'map_filter') {
//         var open_addons = "<div class='col-12' id='" + (counter + 1) + "__block_field'> <h4 class='block_title'>Add map filter</h4>";
//         var close_addons = "</div>";
//         contents += open_addons + up_down + map_filter + close_addons;
//     }
//
//     if (name.includes('query-btn')) {
//         addQueryField(name, (counter + 1));
//     } else {
//         $("#sortable").append(contents);
//     }
//
//     colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]);
//
//
//     // add multiline placeholder
//     var placeholder_t = "Type an example text search query using the placeholder <<searchterm>>,\n\
// 		prefix bds: <http://www.bigdata.com/rdf/search#>\n\
// 		SELECT DISTINCT ?s ?o \n\
// 		WHERE { ?o bds:search '<<searchterm>>' . ?s rdfs:label ?o . } LIMIT 10 \nWe will replace the placeholder with the user input";
//     $(".addplaceholder_textsearch").attr("placeholder", placeholder_t);
//
//     var placeholder_action = "Type a query based on the entity selected in the table. \n\
// 		Use the placeholder <<{column name}>> (change {column name} with the name of the column),\n\
// 		SELECT DISTINCT ?o ?oLabel \n\
// 		WHERE { <<item>> ?p ?o . ?o rdfs:label ?oLabel .} \n\
// 		LIMIT 10";
//     $(".addplaceholder_tablevalueaction").attr("placeholder", placeholder_action);
//
//     var placeholder_combo = "Type a query based on the entities of the two tables. \n\
// 		Use the placeholder <<{column name}>> (change {column name} with the name of the column),\n\
// 		SELECT DISTINCT ?o ?oLabel \n\
// 		WHERE { <<item>> ?p ?o . <<other>> ?p ?o .} \n\
// 		LIMIT 10";
//     $(".addplaceholder_tablecomboaction").attr("placeholder", placeholder_combo);
//
//     var placeholder_map = "Type a query that returns at least the mandatory variables: \
// 		latitude (?lat), longitude (?long) and a URI identifying points (?point). \n\
// 		PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>\n\
// 		PREFIX fabio: <http://purl.org/spar/fabio/>\n\
// 		PREFIX frbr: <http://purl.org/vocab/frbr/core#>\n\
// 		PREFIX owl: <http://www.w3.org/2002/07/owl#>\n\
// 		PREFIX wdt: <http://www.wikidata.org/prop/direct/>\n\
// 		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\
// 		PREFIX psv: <http://www.wikidata.org/prop/statement/value/>\n\
// 		PREFIX wikibase: <http://wikiba.se/ontology#>\n\
// 		PREFIX p: <http://www.wikidata.org/prop/>\n\
// 		PREFIX ps: <http://www.wikidata.org/prop/statement/>\n\
// 		\n\
// 		SELECT DISTINCT  ?point ?artwork ?keeperLabel ?lat ?long WHERE {\n\
// 		 ?s fabio:hasSubjectTerm <https://w3id.org/zericatalog/subject/ritratto-femminile> ;\n\
// 				fabio:hasManifestation ?manif .\n\
// 		 ?manif frbr:exemplar ?point .\n\
// 			?point crm:P50_has_current_keeper ?keeper ; rdfs:label ?artwork.\n\
// 		 ?keeper crm:P74_has_current_or_former_residence ?location .\n\
// 		 OPTIONAL {?keeper rdfs:label ?keeperLabel}\n\
// 		 ?location owl:sameAs ?wdlocation .\n\
// 		 \n\
// 		 FILTER(LANG(?artwork) = '' || LANGMATCHES(LANG(?artwork), 'en'))\n\
// 		 FILTER(LANG(?keeperLabel) = '' || LANGMATCHES(LANG(?keeperLabel), 'en'))\n\
// 		 FILTER(contains (str(?wdlocation), 'wikidata') )\n\
// 		 \n\
// 			SERVICE <https://query.wikidata.org/bigdata/namespace/wdq/sparql> {\n\
// 			 ?wdlocation p:P625 ?coords_stmt .\n\
// 			 ?coords_stmt ps:P625 ?coords;\n\
// 										psv:P625 [\n\
// 											wikibase:geoLatitude ?lat;\n\
// 											wikibase:geoLongitude ?long ] .\n\
// 		 }\n\
// 		} LIMIT 10";
//     $(".addplaceholder_points").attr("placeholder", placeholder_map);
//
//     var placeholder_mapfilter = "Type a query where the variable \
// 		?point appears as subject/object of a pattern. Return ?point and two variables called\
// 		?filter and ?filterLabel. If the filter is a literal value, return only ?point and ?filter. \n\
// 		PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>\n\
// 		SELECT DISTINCT ?point ?filter ?filterLabel\n\
// 		WHERE {\n\
// 		?point crm:P50_has_current_keeper ?filter .\n\
// 		?filter refs:label ?filterLabel .\n\
// 		FILTER(LANG(?filterLabel) = '' || LANGMATCHES(LANG(?filterLabel), 'en'))\n\
// 		}";
//     $(".addplaceholder_mapfilter").attr("placeholder", placeholder_mapfilter);
//
//     counter = $('#sortable [id$="block_field"]').length;
//     updateindex();
//     createTextEditor();
// }

// add new query field
const addQueryField = (name, idx) => {
    const currentDate = new Date();
    const timestamp = currentDate.getTime();

    let content = '';
    const openDiv = '<div class="query-div">'
    const closeDiv = '</div>'
    const query_field = "<label for='largeInput'>SPARQL query</label><br/>\
		<textarea oninput='auto_grow(this)' id='" + idx + "__extra_query_" + timestamp + "' name='" + idx + "__extra_query_" + timestamp + "' type='text' placeholder='Type your query' required></textarea><br/>\
		<input class='form-control' type='text' id='" + idx + "__extra_series_" + timestamp + "' name='" + idx + "__extra_series_" + timestamp + "' placeholder='The label for the data series'><br/>";
    const trash = '<a href="#" class="trash" id="trash" name="trash"><i class="far fa-trash-alt" id="bin"></i></a><br/>';
    content = openDiv + trash + query_field + closeDiv;

    const afterElement = document.getElementById(name);
    afterElement.insertAdjacentHTML('beforebegin', content);
}

// preview content
// $(function () {
//     const update = function () {
//         var fields = $('form').serializeArray();
//         var color_1 = '';
//         var color_2 = '';
//         $('#colors').each(function () {
//             fields.forEach(element => {
//                 if (element.name == 1 + '_color') {
//                     color_1 = element.value;
//                 } else if (element.name == 2 + '_color') {
//                     color_2 = element.value;
//                 }
//             })
//         });
//         console.log(fields);
//         colorSwitch(color_2, color_1);
//         //createTextEditor();
//
//         $('#sortable [id$="block_field"]').each(function (idx) {
//             var text_content = '';
//             var count_query = '';
//             var textsearch_query = '';
//             var count_label = '';
//             var chart_query = '';
//             var chart_title = '';
//             var chart_type = '';
//             var operations = [];
//             var chart_series = '';
//             var extra_queries = [];
//             var extra_series = [];
//             var x_label = [];
//             var y_label = [];
//             var table_title = '';
//             var table_query = '';
//             // map
//             var points_query = '';
//             var filter_id = '';
//             var filter_query = '';
//             var filter_title = 'Filter';
//             var map_filter_bind_query = '';
//             var other_filters = 0;
//             fields.forEach(element => {
//                 if (element.name == (idx + 1) + '__count_query') {
//                     count_query = element.value;
//                 } else if (element.name == (idx + 1) + '__count_label') {
//                     count_label = element.value;
//                     $("#" + (idx + 1) + "__lab").text(count_label);
//                 } else if (element.name == (idx + 1) + '__chart_query') {
//                     chart_query = element.value;
//                 } else if (element.name == (idx + 1) + '__textsearch_query') {
//                     textsearch_query = element.value;
//                 } else if (element.name == (idx + 1) + '__chart_title') {
//                     chart_title = element.value;
//                 } else if (element.name == (idx + 1) + '__chart_type') {
//                     chart_type = element.value;
//                 } else if (element.name == (idx + 1) + '__chart_label_x') {
//                     x_label = element.value;
//                 } else if (element.name == (idx + 1) + '__chart_label_y') {
//                     y_label = element.value;
//                 } else if (element.name == (idx + 1) + '__table_title') {
//                     table_title = element.value;
//                 } else if (element.name == (idx + 1) + '__table_query') {
//                     table_query = element.value;
//                 } else if (element.name.includes((idx + 1) + '__action')) {
//                     operations.push(element.value);
//                 } else if (element.name == ((idx + 1) + '__chart_series')) {
//                     chart_series = element.value;
//                 } else if (element.name.includes((idx + 1) + '__extra_query')) {
//                     extra_queries.push(element.value);
//                 } else if (element.name.includes((idx + 1) + '__extra_series')) {
//                     extra_series.push(element.value);
//                 } else if (element.name == (idx + 1) + '__map_points_query') {
//                     points_query = element.value;
//                     other_filters = $('textarea[id*="__map_filter_query"]').length;
//                 } else if (element.name == (idx + 1) + '__map_filter_query') {
//                     filter_query = element.value;
//                     map_filter_bind_query = $('#' + (idx + 1) + '__map_filter_query').map(function () { return $(this).data('bind-query'); }).get();
//                     other_filters = $('textarea[id*="__map_filter_query"]').length;
//                     filter_title = $("#" + (idx + 1) + "__map_filter_title").val();
//                     filter_id = (idx + 1);
//                 }
//             }
//
//             );
//
//             // show hide elements
//             const queryButton = document.getElementById((idx + 1) + '__query-btn'); // if I put them inside the if, everything works.
//             const querySeries = document.getElementById((idx + 1) + '__chart_series'); // But then I have to delete the else, and when I change the chart they remain visible
//             const axes_label = document.getElementById((idx + 1) + '__axes_label');
//             if (queryButton) {
//                 if (chart_type == 'scatterplot') {
//                     // show
//                     queryButton.style.display = "block";
//                     querySeries.style.display = "block";
//                     axes_label.style.display = "flex";
//                 } else if (chart_type == 'doughnutchart') {
//                     // hide both
//                     queryButton.style.display = "none";
//                     querySeries.style.display = "none";
//                     axes_label.style.display = "none";
//                 } else {
//                     // hide
//                     queryButton.style.display = "none";
//                     querySeries.style.display = "block";
//                     axes_label.style.display = "flex";
//                 }
//             }
//
//             var sparqlEndpoint = datastory_data.sparql_endpoint;
//
//             var encoded_count = encodeURIComponent(count_query);
//             var encoded_chart = encodeURIComponent(chart_query);
//             var encoded_points = encodeURIComponent(points_query);
//             var encoded_filter = encodeURIComponent(filter_query);
//
//             // call for the count
//             if (count_query) {
//                 // $.ajax({
//                 //     type: 'GET',
//                 //     url: sparqlEndpoint + '?query=' + encoded_count,
//                 //     headers: { Accept: 'application/sparql-results+json' },
//                 //     success: function (returnedJson) {
//                 //         const varNumb = returnedJson.head.vars.length;
//                 //         if (varNumb < 1) {
//                 //             alert('This query does not return enough variables. Remember that you only need "count". Check and try again.');
//                 //             console.log('Not enough variables.')
//                 //         } else if (varNumb > 1) {
//                 //             alert('This query returns too many variables. Remember that you only need "count". Check and try again.');
//                 //             console.log('Too many variables.')
//                 //         } else if (varNumb === 1) {
//                 //             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                 //                 var count = returnedJson.results.bindings[i].count.value;
//                 //                 $("#" + (idx + 1) + "__num").text(count);
//                 //             }
//                 //         }
//                 //     },
//                 //     error: function (xhr, ajaxOptions, thrownError) {
//                 //         $("#" + (idx + 1) + "__num").text(xhr.statusText + ' in the query, check and try again.');
//                 //     }
//                 // });
//             }
//
//             // call for the simple table
//             else if (table_query) {
//                 simpleTableViz(sparqlEndpoint, table_query, table_title, (idx + 1));
//             }
//
//             // call for the charts
//             else if (chart_query) {
//                 // scatter plot
//                 if (chart_type == 'scatterplot') {
//                     let queryArray = [];
//
//                     // check if chart requires extra queries
//                     if (extra_queries.length == 0) {
//                         // where I'll store the data necessary fo the scatter plot
//                         let chartData = [];
//                         let tempLabels = [];
//
//                         let query = chart_query;
//                         // check if the query is an API request
//                         if (query.startsWith('http')) {
//                             alert('There is an API request.');
//                             // $.ajax({
//                             //     type: 'GET',
//                             //     url: query,
//                             //     headers: {Accept: 'application/json'},
//                             //     success: function (returnedJson) {
//                             //         do things
//                             //     }
//                             // }
//                         } else {
//                             // if it is a sparql query
//                             var encoded = encodeURIComponent(query);
//                             var sparqlEndpoint = sparqlEndpoint;
//                             $.ajax({
//                                 type: 'GET',
//                                 url: sparqlEndpoint + '?query=' + encoded,
//                                 headers: { Accept: 'application/sparql-results+json' },
//                                 beforeSend: function () { $('#loader').removeClass('hidden') },
//                                 success: function (returnedJson) {
//                                     const queryResults = returnedJson.results.bindings;
//                                     const varNumb = returnedJson.head.vars.length;
//                                     if (varNumb <= 1) {
//                                         alert('This query does not return enough variables. Remember that you only need "x" and "y". Check and try again.');
//                                         console.log('Not enough variables.')
//                                     } else if (varNumb > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "x" and "y". Check and try again.');
//                                         console.log('Too many variables.')
//                                     } else if (varNumb === 2) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('x') && queryVars.includes('x')) {
//                                             for (entry in queryResults) {
//                                                 const xValue = parseInt(queryResults[entry].x.value);
//                                                 const yValue = parseInt(queryResults[entry].y.value);
//                                                 const entryObj = { x: xValue, y: yValue }
//                                                 tempLabels.push(xValue);
//                                                 chartData.push(entryObj);
//                                             }
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need "x" and "y". Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     }
//
//                                     //  retrieve the chart id
//                                     var chartId = $("#" + (idx + 1) + "__chartid");
//                                     var chartColor = color_2;
//                                     // graph plotting
//                                     myScatterChart = new Chart(chartId, {
//                                         type: 'scatter',
//                                         data: {
//                                             datasets: [{
//                                                 label: chart_series,
//                                                 data: chartData,
//                                                 backgroundColor: chartColor
//                                             }]
//                                         },
//                                         options: {
//                                             responsive: true,
//                                             plugins: {
//                                                 legend: {
//                                                     position: 'top',
//                                                 }
//                                             },
//                                             scales: {
//                                                 yAxes: [{
//                                                     scaleLabel: {
//                                                         display: true,
//                                                         labelString: y_label
//                                                     }
//                                                 }],
//                                                 xAxes: [{
//                                                     scaleLabel: {
//                                                         display: true,
//                                                         labelString: x_label
//                                                     }
//                                                 }]
//                                             }
//                                         }
//                                     });
//                                 },
//                                 complete: function () {
//                                     $('#loader').addClass('hidden');
//                                     return true;
//                                 },
//                                 error: function (xhr, ajaxOptions, thrownError) {
//                                     queryError(xhr, ajaxOptions, thrownError);
//                                 }
//                             })
//                         }
//                     } else if (extra_queries.length > 0) {
//                         let query = chart_query;
//                         let seriesArray = [];
//                         let datasetArray = [];
//                         queryArray.push(query);
//                         seriesArray.push(chart_series);
//
//                         for (e of extra_queries) {
//                             queryArray.push(e);
//                         }
//
//                         for (s of extra_series) {
//                             seriesArray.push(s);
//                         }
//
//                         // generate colors based on number of queries
//                         var colors = d3.quantize(d3.interpolateHcl(color_2, color_1), queryArray.length);
//
//                         for (const [i, q] of queryArray.entries()) {
//                             let scatter_query = q;
//                             let chartData = [];
//                             let dataDict = {};
//
//                             // check if the query is an API request
//                             if (scatter_query.startsWith('http')) {
//                                 alert('There is an API request.');
//                                 // $.ajax({
//                                 //     type: 'GET',
//                                 //     url: query,
//                                 //     headers: {Accept: 'application/json'},
//                                 //     success: function (returnedJson) {
//                                 //         do things
//                                 //     }
//                                 // }
//                             } else {
//                                 // if it is a sparql query
//                                 var encoded = encodeURIComponent(scatter_query);
//                                 var sparqlEndpoint = sparqlEndpoint;
//                                 $.ajax({
//                                     type: 'GET',
//                                     url: sparqlEndpoint + '?query=' + encoded,
//                                     headers: { Accept: 'application/sparql-results+json' },
//                                     beforeSend: function () { $('#loader').removeClass('hidden') },
//                                     success: function (returnedJson) {
//                                         const queryResults = returnedJson.results.bindings;
//                                         const varNumb = returnedJson.head.vars.length;
//                                         if (varNumb <= 1) {
//                                             alert('This query does not return enough variables. Remember that you only need "x" and "y". Check and try again.');
//                                             console.log('Not enough variables.')
//                                         } else if (varNumb > 2) {
//                                             alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                             console.log('Too many variables.')
//                                         } else if (varNumb === 2) {
//                                             // check if var names are correct
//                                             const queryVars = returnedJson.head.vars;
//                                             if (queryVars.includes('x') && queryVars.includes('x')) {
//                                                 for (entry in queryResults) {
//                                                     const xValue = parseInt(queryResults[entry].x.value);
//                                                     const yValue = parseInt(queryResults[entry].y.value);
//                                                     const entryObj = { x: xValue, y: yValue }
//                                                     chartData.push(entryObj);
//                                                 }
//                                                 dataDict.data = chartData;
//                                                 dataDict.label = seriesArray[i];
//                                                 dataDict.backgroundColor = colors[i];
//                                                 datasetArray.push(dataDict);
//                                                 myScatterChart.update();
//                                             } else {
//                                                 alert('This query may return wrong variable names. Remember that you need "x" and "y". Check and try again.');
//                                                 console.log('Wrong variables.')
//                                             }
//                                         }
//                                     },
//                                     complete: function () {
//                                         $('#loader').addClass('hidden');
//                                         return true;
//                                     },
//                                     error: function (xhr, ajaxOptions, thrownError) {
//                                         queryError(xhr, ajaxOptions, thrownError);
//                                     }
//                                 });
//                             }
//                         }
//
//
//                         //  retrieve the chart id
//                         var chartId = $("#" + (idx + 1) + "__chartid");
//                         console.log(datasetArray)
//                         // graph plotting
//                         myScatterChart = new Chart(chartId, {
//                             type: 'scatter',
//                             data: data = {
//                                 datasets: datasetArray
//                             },
//                             options: {
//                                 responsive: true,
//                                 legend: {
//                                     position: 'top',
//                                 },
//                                 scales: {
//                                     yAxes: [{
//                                         scaleLabel: {
//                                             display: true,
//                                             labelString: y_label
//                                         }
//                                     }],
//                                     xAxes: [{
//                                         scaleLabel: {
//                                             display: true,
//                                             labelString: x_label
//                                         }
//                                     }]
//                                 }
//                             }
//                         });
//                     }
//                 } else {
//                     $.ajax({
//                         type: 'GET',
//                         url: sparqlEndpoint + '?query=' + encoded_chart,
//                         headers: { Accept: 'application/sparql-results+json' },
//                         beforeSend: function () { $('#loader').removeClass('hidden') },
//                         success: function (returnedJson) {
//                             if (chart_type == 'barchart') {
//                                 var chartData = [];
//                                 var chartLabels = [];
//                                 var varNumber = returnedJson.head.vars.length;
//                                 // with operations
//                                 if (operations.length > 0) {
//                                     if (varNumber === 1) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('label')) {
//                                             var label = [];
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 if (returnedJson.results.bindings[i].label.value == '') {
//                                                     label[i] = 'Unknown'
//                                                 } else {
//                                                     label[i] = returnedJson.results.bindings[i].label.value;
//                                                 }
//
//                                             }
//                                             operations.forEach(o => {
//                                                 var action = o
//                                                 if (action == 'count') {
//                                                     var param = 'label';
//                                                     // activate the operations on the data
//                                                     var elCount = eval(action + '(' + param + ')');
//                                                     // where I'll store the data necessary for the chart
//                                                     chartData = Object.values(elCount);
//                                                     chartLabels = Object.keys(elCount);
//                                                 }
//                                             })
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need only "label" if you use the Count operation. Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     } else if (varNumber === 2) {
//                                         alert('This query may NOT require the "Count" operation. Please check and try again.');
//                                         console.log('Count not required.')
//                                     } else if (varNumber > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                         console.log('Too many variables.')
//                                     }
//                                 } else if (operations.length == 0) {
//                                     // without operations
//                                     if (varNumber === 1) {
//                                         alert('This query may require the "Count" operation. Please check and try again.');
//                                         console.log('Count required.')
//                                     } else if (varNumber === 2) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('count') && queryVars.includes('label')) {
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                                                 chartData[i] = returnedJson.results.bindings[i].count.value;
//                                             }
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need "count" and "label". Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     } else if (varNumber > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                         console.log('Too many variables.')
//                                     }
//                                 }
//
//                                 //  retrieve the chart id
//                                 var chartId = $("#" + (idx + 1) + "__chartid");
//                                 var chartColor = color_2;
//                                 var myBarChart = new Chart(chartId, {
//                                     type: 'bar',
//                                     data: {
//                                         labels: chartLabels,
//                                         datasets: [{
//                                             label: chart_series,
//                                             backgroundColor: chartColor,
//                                             borderColor: chartColor,
//                                             data: chartData,
//                                         }],
//                                     },
//                                     options: {
//                                         responsive: true,
//                                         maintainAspectRatio: true,
//                                         scaleShowValues: true,
//                                         scales: {
//                                             yAxes: [{
//                                                 scaleLabel: {
//                                                     display: true,
//                                                     labelString: y_label
//                                                 },
//                                                 beginAtZero: true
//                                             }],
//                                             xAxes: [{
//                                                 scaleLabel: {
//                                                     display: true,
//                                                     labelString: x_label
//                                                 },
//                                                 ticks: {
//                                                     autoSkip: false
//                                                 }
//                                             }]
//                                         },
//                                         legend: {
//                                             labels: {
//                                                 boxWidth: 20,
//                                                 padding: 10,
//                                             }
//                                         }
//                                     }
//                                 });
//                             } else if (chart_type == 'linechart') {
//                                 var chartData = [];
//                                 var chartLabels = [];
//                                 var varNumber = returnedJson.head.vars.length;
//                                 // with operations
//                                 if (operations.length > 0) {
//                                     if (varNumber === 1) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('label')) {
//                                             var label = [];
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 if (returnedJson.results.bindings[i].label.value == '') {
//                                                     label[i] = 'Unknown'
//                                                 } else {
//                                                     label[i] = returnedJson.results.bindings[i].label.value;
//                                                 }
//
//                                             }
//
//                                             operations.forEach(o => {
//                                                 var action = o
//                                                 if (action == 'count') {
//                                                     var param = 'label';
//                                                     // activate the operations on the data
//                                                     var elCount = eval(action + '(' + param + ')');
//                                                     // where I'll store the data necessary for the chart
//                                                     chartData = Object.values(elCount);
//                                                     chartLabels = Object.keys(elCount);
//                                                 }
//                                             })
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need only "label" if you use the Count operation. Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     } else if (varNumber === 2) {
//                                         alert('This query may NOT require the "Count" operation. Please check and try again.');
//                                         console.log('Count required.')
//                                     } else if (varNumber > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                         console.log('Too many variables.')
//                                     }
//                                 } else if (operations.length == 0) {
//                                     // without operations
//                                     if (varNumber === 1) {
//                                         alert('This query may require the "Count" operation. Please check and try again.');
//                                         console.log('Count required.')
//                                     } else if (varNumber === 2) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('count') && queryVars.includes('label')) {
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                                                 chartData[i] = returnedJson.results.bindings[i].count.value;
//                                             }
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need "count" and "label". Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     } else if (varNumber > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                         console.log('Too many variables.')
//                                     }
//                                 }
//                                 //  retrieve the chart id
//                                 var chartId = $("#" + (idx + 1) + "__chartid");
//                                 var chartColor = color_2;
//                                 // graph plotting
//                                 var myLineChart = new Chart(chartId, {
//                                     type: 'line',
//                                     data: {
//                                         labels: chartLabels,
//                                         datasets: [{
//                                             label: chart_series,
//                                             borderColor: chartColor,
//                                             pointBorderColor: "#FFF",
//                                             pointBackgroundColor: chartColor,
//                                             pointBorderWidth: 2,
//                                             pointHoverRadius: 4,
//                                             pointHoverBorderWidth: 1,
//                                             pointRadius: 4,
//                                             backgroundColor: 'transparent',
//                                             fill: true,
//                                             borderWidth: 2,
//                                             data: chartData
//                                         }]
//                                     },
//                                     options: {
//                                         responsive: true,
//                                         maintainAspectRatio: true,
//                                         spanGaps: true,
//                                         legend: {
//                                             labels: {
//                                                 boxWidth: 20,
//                                                 padding: 10
//                                             }
//                                         },
//                                         scaleShowValues: true,
//                                         scales: {
//                                             yAxes: [{
//                                                 scaleLabel: {
//                                                     display: true,
//                                                     labelString: y_label
//                                                 },
//                                                 beginAtZero: true
//                                             }],
//                                             xAxes: [{
//                                                 scaleLabel: {
//                                                     display: true,
//                                                     labelString: x_label
//                                                 },
//                                                 ticks: {
//                                                     autoSkip: false
//                                                 }
//                                             }]
//                                         },
//                                         tooltips: {
//                                             bodySpacing: 4,
//                                             mode: "nearest",
//                                             intersect: 0,
//                                             position: "nearest",
//                                             xPadding: 10,
//                                             yPadding: 10,
//                                             caretPadding: 10
//                                         },
//                                         layout: {
//                                             padding: { left: 15, right: 15, top: 15, bottom: 15 }
//                                         }
//                                     }
//                                 });
//                             } else if (chart_type == 'doughnutchart') {
//                                 var chartData = [];
//                                 var chartLabels = [];
//                                 var varNumber = returnedJson.head.vars.length;
//
//                                 // with operations
//                                 if (operations.length > 0) {
//                                     if (varNumber === 1) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('label')) {
//                                             var label = [];
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 if (returnedJson.results.bindings[i].label.value == '') {
//                                                     label[i] = 'Unknown'
//                                                 } else {
//                                                     label[i] = returnedJson.results.bindings[i].label.value;
//                                                 }
//
//                                             }
//
//                                             operations.forEach(o => {
//                                                 var action = o
//                                                 if (action == 'count') {
//                                                     var param = 'label';
//                                                     // activate the operations on the data
//                                                     var elCount = eval(action + '(' + param + ')');
//                                                     // where I'll store the data necessary for the chart
//                                                     chartData = Object.values(elCount);
//                                                     chartLabels = Object.keys(elCount);
//                                                 }
//                                             })
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need only "label" if you use the Count operation. Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     } else if (varNumber === 2) {
//                                         alert('This query may NOT require the "Count" operation. Please check and try again.');
//                                         console.log('Count required.')
//                                     } else if (varNumber > 2) {
//                                         alert('This query returns too many variables. Remember that you only need "count" and "label". Check and try again.');
//                                         console.log('Too many variables.')
//                                     }
//                                 } else if (operations.length == 0) {
//                                     // without operations
//                                     if (varNumber === 1) {
//                                         alert('This query may require the "Count" operation. Please check and try again.');
//                                         console.log('Count required.')
//                                     } else if (varNumber === 2) {
//                                         // check if var names are correct
//                                         const queryVars = returnedJson.head.vars;
//                                         if (queryVars.includes('count') && queryVars.includes('label')) {
//                                             for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                                 chartData[i] = returnedJson.results.bindings[i].count.value;
//                                                 if (returnedJson.results.bindings[i].label.value == '') {
//                                                     chartLabels[i] = 'Unknown'
//                                                 } else {
//                                                     chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                                                 }
//                                             }
//                                         } else {
//                                             alert('This query may return wrong variable names. Remember that you need "count" and "label". Check and try again.');
//                                             console.log('Wrong variables.')
//                                         }
//                                     }
//                                 }
//
//                                 // retrieve the chart id
//                                 var chartId = $("#" + (idx + 1) + "__chartid");
//                                 // chart colors
//                                 // Don't understand why, function chartColors can't be read. So I extracted the content and applied directly
//                                 // var chartColors = chartColor(color_1, color_2, chartLabels.length);
//                                 if (chartLabels.length === 1) {
//                                     var chartColors = color_2;
//                                 } else {
//                                     var chartColors = d3.quantize(d3.interpolateHcl(color_2, color_1), chartLabels.length);
//                                 }
//
//
//                                 // chart plotting
//                                 var myDoughnutChart = new Chart(chartId, {
//                                     type: 'doughnut',
//                                     data: {
//                                         datasets: [{
//                                             data: chartData,
//                                             backgroundColor: chartColors
//                                         }],
//
//                                         labels: chartLabels
//                                     },
//                                     options: {
//                                         responsive: true,
//                                         maintainAspectRatio: true,
//                                         legend: {
//                                             position: 'right'
//                                         },
//                                         layout: {
//                                             padding: {
//                                                 left: 20,
//                                                 right: 20,
//                                                 top: 20,
//                                                 bottom: 20
//                                             }
//                                         }
//                                     }
//                                 });
//                             }
//
//                         },
//                         complete: function () {
//                             $('#loader').addClass('hidden');
//                             return true;
//                         },
//                         error: function (xhr, ajaxOptions, thrownError) {
//                             queryError(xhr, ajaxOptions, thrownError);
//                         }
//                     });
//                 }
//             }
//
//             // textsearch
//             else if (textsearch_query) {
//                 var encoded_textsearch = encodeURIComponent(textsearch_query);
//                 // empty the table with results
//                 $("#" + idx + "__textsearchid tr").detach();
//             }
//
//             // map
//             else if (points_query) {
//                 // run the first time and then on demand
//                 var rerun = $("a[data-id='" + (idx + 1) + "__rerun_query'");
//                 if (rerun.data("run") == true) {
//                     if (other_filters > 0) {
//                         var waitfilters = true
//                     } else {
//                         let sidebarContainer = document.querySelector(".leaflet-sidebar-content");
//                         while (sidebarContainer.firstChild) {
//                             sidebarContainer.removeChild(sidebarContainer.firstChild);
//                         }
//                         var waitfilters = false
//                     };
//                     map_ready = createMap(sparqlEndpoint, encoded_points, (idx + 1) + '__map_preview_container', (idx + 1), waitfilters, color_2);
//                     rerun.data("run", false);
//                 } else {
//                     // update color
//                     let mapContainer = document.getElementById((idx + 1) + '__map_preview_container');
//                     let spanColorElements = mapContainer.getElementsByClassName('pointer-color');
//                     for (singleColorElement of spanColorElements) {
//                         singleColorElement.style.background = color_2;
//                     }
//                 }
//             }
//             // map filter
//             else if (filter_query) {
//                 // TODO fix this in case multiple maps are allowed
//                 var rerun = $("a[data-id='1__rerun_query'");
//                 if (other_filters <= 1) { sidebar = initSidebar() };
//                 if (map_ready != undefined && map_ready == true) {
//                     console.log("calling add filter");
//                     addFilterMap(sparqlEndpoint, encoded_filter, map_filter_bind_query, filter_title, filter_id, checked_filters);
//                 }
//             }
//         });
//
//     };
//     update();
//     $('form').change(update);
// });

const addQueryArea = () => {
    console.log('check');
}

// function for errors in sparql queries
const queryError = (xhr, ajaxOptions, thrownError) => {
    var error_text = 'There is an ' + xhr.statusText + ' in the query, check and try again.';
    alert(error_text);
    console.log(xhr);
}

//// MAPS TEMPLATE FUNCTIONS ////

// rerun maps query on demand
function rerunQuery(pos, el) {
    $("a[data-id='" + pos + "__rerun_query']").data("run", true);
    $('form').trigger('change');
}

// initialize an empty map, used directly in templates
function initMap(pos) {
    var map = L.map(pos + "__map_preview_container").setView([51.505, -0.09], 3);
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=5303ddca-5934-45fc-bdf1-40fac7966fa7', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    return map
}

// get geo data from SPARQL endpoint and send to map
function createMap(sparqlEndpoint, encoded_query, mapid, idx = 0, waitfilters = false, color_code) {
    $.ajax({
        type: 'POST',
        url: sparqlEndpoint + '?query=' + encoded_query,
        headers: { Accept: 'application/sparql-results+json' },
        beforeSend: function () { $('#loader').removeClass('hidden') },
        success: function (returnedJson) {
            // preview map
            var geoJSONdata = creategeoJSON(returnedJson);
            markers = setView(mapid, geoJSONdata, waitfilters, color_code);
            allMarkers = setView(mapid, geoJSONdata, waitfilters, color_code);
            if (waitfilters == true) {
                showFilters(datastory_data.dynamic_elements.length);
            }
        },
        complete: function () {
            $('#loader').addClass('hidden');
            return true;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            queryError(xhr, ajaxOptions, thrownError);
        }
    });
}

function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

// fill in an already initialized map (initMap())
// with data points received from createMap()
function setView(mapid, geoJSONdata, waitfilters, color_code) {
    // remove markers if any from a map already initialised
    map.eachLayer(function (layer) {
        if (layer instanceof L.MarkerClusterGroup) {
            map.removeLayer(layer)
        }
    });
    // remove geoJSON
    $('#dataMap').remove();

    // style clusters
    var innerClusterStyle = "display: inline-block; background:" + color_code + ";\
		width: 40px; height: 40px !important; border-radius: 50% !important; padding-top: 10px; opacity: 0.8;"

    var markers = L.markerClusterGroup({
        iconCreateFunction: function (cluster) {
            var markers = cluster.getAllChildMarkers();
            var n = 0;
            for (var i = 0; i < markers.length; i++) { n += 1; }
            return L.divIcon({ html: "<span style='" + innerClusterStyle + "'>" + n + "</span>", className: 'mycluster pointer-color', iconSize: L.point(40, 40) });
        },
        singleMarkerMode: true
    });

    // get markers from geoJSON, bind popupContent
    var data_layers = L.geoJSON(geoJSONdata, {
        onEachFeature: onEachFeature
    });

    // add markers to clusters
    markers.addLayer(data_layers);

    // show clusters
    map.addLayer(markers);

    // add geoJSONdata to DOM
    var $body = $(document.body);
    $body.append("<script id='dataMap' type='application/json'>" + JSON.stringify(geoJSONdata) + "</script>");
    if (waitfilters == true) {
        map_ready = true;
        $('form').trigger('change');
    }
    return markers;
}

function creategeoJSON(returnedJson) {
    var geoJSONdata = [];
    // clean headings
    var headings = returnedJson.head.vars;
    var there_is_point = headings.indexOf('point');
    for (j = 0; j < headings.length; j++) {
        if (headings[j] == ('lat') || headings[j] == ('long') || headings[j] == ('point')) {
            headings.splice(j, 1); j--;
        }
    }
    // create geoJSON object
    for (i = 0; i < returnedJson.results.bindings.length; i++) {
        var queryResults = returnedJson.results.bindings;
        pointObj = {};
        pointObj.type = "Feature";
        pointObj.properties = {};
        pointObj.properties.popupContent = "";
        for (j = 0; j < headings.length; j++) {
            pointObj.properties.popupContent += queryResults[i][headings[j]].value + '.\n\ '
        }
        if (there_is_point != -1) {
            pointObj.properties.uri = queryResults[i]['point'].value;
            pointObj.properties.popupContent += "<br><a target='_blank' href='" + queryResults[i].point.value + "'>URI</a>"
        };
        pointObj.geometry = {};
        pointObj.geometry.type = "Point";
        // check first
        pointObj.geometry.coordinates = [queryResults[i].long.value, queryResults[i].lat.value];
        geoJSONdata.push(pointObj);
    }
    return geoJSONdata
};

function initSidebar() {
    sidebar = L.control.sidebar({
        autopan: false,       // whether to maintain the centered map point when opening the sidebar
        closeButton: true,    // whether t add a close button to the panes
        container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
        position: 'left',     // left or right
    }).addTo(map);
    //$(".leaflet-sidebar").css("background",'linear-gradient(-45deg,' + datastory_data.color_code[0] + ',' + datastory_data.color_code[1] + ') !important');
    return sidebar;
};

function showFilters(count) {
    if (count > 1) {
        for (let step = 2; step < count + 1; step++) {
            var qf = $("#" + step + "__map_filter_query").val().replace('\n', '');
            var encoded_filter = encodeURIComponent(qf);
            var map_filter_bind_query = $('#1__map_filter_query').map(function () { return $(this).data('bind-query'); }).get();
            var filter_title = $("#" + step + "__map_filter_title").val();
            var filter_id = step;
            var checked_filters = Array.from(document.querySelectorAll('input[class="map_chechbox"]:checked'));
            addFilterMap(datastory_data.sparql_endpoint, encoded_filter, map_filter_bind_query, filter_title, filter_id, checked_filters);
        }
    }
};

function collapseFilter(panel_id) { $("#" + panel_id + " p").toggle(); }

function test() {
    console.log(document.querySelector('[role="tab"]'));
}

function addFilterMap(sparqlEndpoint, encoded_query, map_filter_bind_query, filter_title, filter_id, checked_filters) {
    // get the list of URIs from geoJSON
    var dataMap = JSON.parse(document.getElementById('dataMap').innerHTML);
    var values = "VALUES ?point {";
    for (var i = 0; i < dataMap.length; i++) {
        values += '<' + dataMap[i].properties.uri + '> ';
    }
    values += '}';

    // restructure query with VALUES
    // might have performance issues!
    var decoded_query = decodeURIComponent(encoded_query);
    var decoded_query_parts = decoded_query.split(/\{(.*)/s);
    decoded_query = decoded_query_parts[0] + '{' + values + decoded_query_parts[1];
    encoded_query = encodeURIComponent(decoded_query);

    // get the data
    $.ajax({
        type: 'POST',
        url: sparqlEndpoint + '?query=' + encoded_query,
        headers: { Accept: 'application/sparql-results+json' },
        beforeSend: function () { $('#loader').removeClass('hidden') },
        success: function (returnedJson) {
            // modify geoJSON and create list
            var labels_values_count = {};

            for (i = 0; i < returnedJson.results.bindings.length; i++) {
                var res = returnedJson.results.bindings[i];
                // check if the filter is a string or a uri+string
                var headings = returnedJson.head.vars;
                var has_label = false;
                if (headings.includes('filterLabel')) { has_label = true; }
                // update geoJSON object in DOM
                for (var j = 0; j < dataMap.length; j++) {
                    if (dataMap[j].properties.uri == res.point.value) {
                        if (has_label == true) {
                            dataMap[j].properties[filter_title + "#label"] = res.filterLabel.value;
                            dataMap[j].properties[filter_title + "#value"] = res.filter.value;
                            if (labels_values_count[res.filter.value] == undefined) {
                                labels_values_count[res.filter.value] = [res.filterLabel.value, 1]
                            } else {
                                labels_values_count[res.filter.value] = [res.filterLabel.value, labels_values_count[res.filter.value][1] + 1]
                            }
                        } else {
                            dataMap[j].properties[filter_title + "#label"] = res.filter.value;
                            dataMap[j].properties[filter_title + "#value"] = res.filter.value;
                            if (labels_values_count[res.filter.value] == undefined) {
                                labels_values_count[res.filter.value] = [res.filter.value, 1]
                            } else {
                                labels_values_count[res.filter.value] = [res.filter.value, labels_values_count[res.filter.value][1] + 1]
                            }
                        }
                    }
                }
                // update geoJSON in DOM
                $('#dataMap').remove();
                var $body = $(document.body);
                $body.append("<script id='dataMap' type='application/json'>" + JSON.stringify(dataMap) + "</script>");

                // update markers
                markers.eachLayer(layer => {
                    if (layer.feature.properties.uri == res.point.value) {
                        if (has_label == true) {
                            layer.feature.properties[filter_title + "#label"] = res.filterLabel.value;
                        } else {
                            layer.feature.properties[filter_title + "#label"] = res.filter.value;
                        }
                        layer.feature.properties[filter_title + "#value"] = res.filter.value;
                    }
                });
            }


            // get markers from geoJSON, bind popupContent
            var data_layers = L.geoJSON(dataMap, {
                onEachFeature: onEachFeature
            });
            //console.log("addFilterMap "+filter_title+" - markers");

            // add markers to clusters
            //markers = L.markerClusterGroup();
            //markers.addLayer(data_layers);
            //logMarkers(markers);

            // add panel
            createPanel(filter_id, filter_title, labels_values_count, checked_filters);
        },
        complete: function () {
            $('#loader').addClass('hidden');
            sortPanels();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            queryError(xhr, ajaxOptions, thrownError);
        }
    });

};

function createPanel(filter_id, filter_title, labels_values_count, checked_filters) {
    // empty panel if exists
    console.log("createPanel - START", filter_title);
    //if ($("#"+filter_id+'_panel') != undefined) {sidebar.removePanel(filter_id+'_panel');}
    if ($("#" + filter_id + '_panel') != undefined) {
        sidebar.removePanel(filter_id + '_panel');
        $("#" + filter_id + '_panel').detach();
        $('a[href="#' + filter_id + '_panel"]').detach();
    };

    var groupCheckboxes = document.createElement("section");
    groupCheckboxes.id = filter_id + "_panel";
    var group_title = document.createElement("h3");
    var filterCaret = document.createElement('span');
    filterCaret.className = 'caret';
    filterCaret.setAttribute('onclick', 'collapseFilter("' + filter_id + '_panel")');
    group_title.append(document.createTextNode(filter_title));
    group_title.append(filterCaret);
    groupCheckboxes.appendChild(group_title);

    // create list of checkboxes
    for (const [key, value] of Object.entries(labels_values_count)) {
        // create elements
        var label = document.createElement("label");
        var checkbox = document.createElement("input");
        var singlecheckbox = document.createElement("p");

        checkbox.type = 'checkbox';
        checkbox.label = value[0] + " (" + value[1] + ")";
        checkbox.value = key;
        checkbox.name = key;
        checkbox.className = "map_chechbox";
        checkbox.setAttribute("data-filter", filter_title);
        checkbox.checked = checkvalue(checkbox, checked_filters);
        label.append(document.createTextNode(checkbox.label));
        singlecheckbox.append(checkbox);
        singlecheckbox.append(label);
        groupCheckboxes.appendChild(singlecheckbox);
    }

    // add panel
    var panelContent = {
        id: filter_id + '_panel',
        tab: '',
        pane: groupCheckboxes,
        title: filter_title,
        position: 'top'
    };
    sidebar.addPanel(panelContent);

    let tabHamburger = document.getElementById('tab-hamburger');
    tabMenu(tabHamburger);
}

function tabMenu(tabHamburger) {
    let aTabs = document.querySelectorAll('[role="tab"]');
    if (tabHamburger === null) {
        let iTabElement = document.createElement('i');
        iTabElement.className = 'fa fa-bars';
        iTabElement.id = 'map-ham';
        let aTab1 = document.querySelector('[role="tab"]');
        aTab1.id = 'tab-hamburger';
        aTab1.appendChild(iTabElement);
    }
    for (const value of Object.values(aTabs)) {
        if (value.id != 'tab-hamburger') {
            value.parentElement.remove();
        }
    }
}

function sortPanels() {
    // var ps = document.querySelectorAll( ".leaflet-sidebar-content section" );
    // var sortedPs = Array.from( ps ).sort( (a, b) => a.id.localeCompare( b.id ) ); //sort the ps
    // //document.querySelector( ".leaflet-sidebar-content" ).innerHTML = sortedPs.map( s => s.outerHTML ).join(""); //recreate the markup
    // var tags = document.querySelector( ".leaflet-sidebar-content" );
    // var dupTags = tags.cloneNode(false);
    // sortedPs.forEach( s => dupTags.appendChild ( s ) );
    // //replace old with new tags
    // tags.parentNode.replaceChild(dupTags ,tags);
}

function checkvalue(checkbox, checked_filters) {
    var checked = false;
    if (checked_filters != undefined && checked_filters.length) {
        for (const value of checked_filters.values()) {
            if (checkbox.name == value.name) { checked = true; break; }
        }
    }
    return checked;
}

function addRemoveMarkers(checked_filters) {
    console.log("addRemoveMarkers: checked_filters", checked_filters);
    if (markers != undefined) {
        markers.clearLayers();
        allMarkers.eachLayer(layer => {
            markers.addLayer(layer);
        });
        console.log("addRemoveMarkers: recreate all markers");
        logMarkers(markers);

        // get the filter names
        var filternames = [];
        if (checked_filters.length) {
            for (const value of checked_filters.values()) {
                filternames.push(value.dataset.filter);
            }
        }
        // [ filter1, filter2 ...]
        filternames = [...new Set(filternames)];

        // add values checked
        var filternames_values = {};
        filternames.forEach(function (el, index) {
            filternames_values[el] = [];
        });
        // { filter1: [ checkbox1value, checkbox2value], filter2 : [ ... ] ...]
        if (checked_filters.length) {
            for (const value of checked_filters.values()) {
                filternames_values[value.dataset.filter].push(value.value)
            }
        }
        console.log("filternames_values", filternames_values);
        if (Object.keys(filternames_values).length) {
            for (const [key, value] of Object.entries(filternames_values)) {
                markers.eachLayer(layer => {
                    // if property value not in the list of checked-checkboxes values remove marker
                    var prop_key = key + '#value';
                    var prop_value = layer.feature.properties[prop_key];
                    if (!value.includes(prop_value)) {
                        console.log("remove this", layer.feature.properties);
                        markers.removeLayer(layer);
                    }
                });
            }
            console.log("addRemoveMarkers: removed markers");
            //logMarkers(markers);
            // clear map
            map.eachLayer(function (layer) {
                if (layer instanceof L.MarkerClusterGroup) {
                    map.removeLayer(layer)
                }
            });
            map.addLayer(markers);

        }
        // else put them all back!
        else {
            console.log("put all markers back");
            // var data_layers = L.geoJSON(dataMap, {
            // 	onEachFeature: onEachFeature
            // });

            map.eachLayer(function (layer) {
                if (layer instanceof L.MarkerClusterGroup) {
                    map.removeLayer(layer)
                }
            });
            markers.clearLayers();
            allMarkers.eachLayer(layer => {
                markers.addLayer(layer);
            });
            map.addLayer(markers);
        }
    }
}


function logMarkers(markers) {
    markers.eachLayer(layer => {
        console.log(layer.feature.properties);
    });
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
        headers: { Accept: 'application/sparql-results+json' },
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
    }

    // send the query
    $.ajax({
        type: 'GET',
        url: datastory_data.sparql_endpoint + '?query=' + reencoded_query,
        headers: { Accept: 'application/sparql-results+json' },
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
        }
    });
    return actions;
}

function createResultsTable(returnedJson, actions, pos, table_pos = pos, action_title = "search", text_value = "", uri_or_text_value = "") {
    var tabletoappend = "<caption class='resulttable_caption' \
	style='color: white'>"+ decodeURIComponent(action_title) + "\
	<span class='caret' onclick='collapseTable(\""+ pos + "__textsearchid\")'></span>\
    <a id='export_"+ pos + "' class='btn btn-info btn-border btn-round btn-sm mr-2'> Export HTML</a>\
    <a id='csv_"+ pos + "' class='btn btn-info btn-border btn-round btn-sm mr-2'> Export CSV</a>\
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
    exportTableHtml(pos, 'textsearch');
    exportTableCsv(pos, 'textsearch', action_title);

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
    var mapSidebar = document.querySelectorAll(".leaflet-sidebar");
    // var mapSidebarTab = document.querySelectorAll(".leaflet-sidebar-tabs");
    //var textsearch_buttons = document.querySelectorAll(".textsearch_button");
    //gradientEl.classList.remove("bg-primary-gradient");
    if (typeof (gradientEl) != undefined && gradientEl != null) { gradientEl.style.background = 'linear-gradient(-45deg,' + color_1 + ',' + color_2 + ')'; }

    function monchromebackground(el) {
        el.style.background = color_2;
    }
    function gradientbackground(el) {
        el.style.background = 'linear-gradient(-45deg,' + color_1 + ',' + color_2 + ')';
    }
    if (typeof (gradientPreview) != undefined && gradientPreview != null) {
        gradientPreview.forEach(gradientbackground);
    }
    // does not work
    if (typeof (mapSidebar) != undefined && mapSidebar != null) {
        mapSidebar.forEach(gradientbackground);
    }
    // if (typeof (mapSidebarTab) != undefined && mapSidebarTab != null) {
    //     mapSidebarTab.forEach(monchromebackground);
    // }

    function borders(el) {
        el.style.border = "solid 2px " + color_1;
        el.style.color = color_1;
    }
    counters.forEach(borders);

}

// show counters in the final data story
// function queryCounter() {
//     if (datastory_data.dynamic_elements) {
//         datastory_data.dynamic_elements.forEach(element => {
//             if (element.type == 'count') {
//                 var query = element.count_query;
//                 // check if the query is an API request
//                 if (query.startsWith('http')) {
//                     alert('There is an API request.');
//                     // $.ajax({
//                     //     type: 'GET',
//                     //     url: query,
//                     //     headers: {Accept: 'application/json'},
//                     //     success: function (returnedJson) {
//                     //         do things
//                     //     }
//                     // }
//                 } else {
//                     // if it is a sparql query
//                     var encoded = encodeURIComponent(query);
//                     var sparqlEndpoint = datastory_data.sparql_endpoint;
//                     var count_label = element.count_label;
//                     $.ajax({
//                         type: 'GET',
//                         url: sparqlEndpoint + '?query=' + encoded,
//                         headers: { Accept: 'application/sparql-results+json' },
//                         success: function (returnedJson) {
//                             const varNumb = returnedJson.head.vars.length;
//                             if (varNumb === 1) {
//                                 for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                                     var count = returnedJson.results.bindings[i].count.value;
//                                     // create div to set the column
//                                     var generalDiv = document.createElement("div");
//                                     generalDiv.className = "px-2 pb-2 pb-md-0 text-center";
//                                     // create div to contain number and label
//                                     var countDiv = document.createElement("div");
//                                     countDiv.className = "card-body option-2b";
//                                     var numP = document.createElement("p");
//                                     numP.appendChild(document.createTextNode(count));
//                                     numP.className = 'counter_num';
//                                     countDiv.appendChild(numP);
//                                     // create and append p for label
//                                     var labelP = document.createElement("p");
//                                     labelP.appendChild(document.createTextNode(count_label));
//                                     labelP.className = 'counter_label';
//                                     countDiv.appendChild(labelP);
//                                     generalDiv.appendChild(countDiv);
//                                     colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]);
//                                     // get container and append
//                                     var container = document.getElementById(element.position);
//                                     container.appendChild(generalDiv);
//                                 }
//                             } else {
//                                 console.log('Too many variables. Error in the query.')
//                             }
//                         },
//                         error: function (xhr, ajaxOptions, thrownError) {
//                             queryError(xhr, ajaxOptions, thrownError);
//                         }
//                     })
//                 }
//             }
//         })
//     }
// }

// function chartViz() {
//     if (datastory_data.dynamic_elements) {
//         datastory_data.dynamic_elements.forEach(element => {
//             if (element.type === 'chart') {
//                 var chart = element.chart_type;
//                 if (chart === "barchart") {
//                     barchart(element);
//                 } else if (chart === "linechart") {
//                     linechart(element);
//                 } else if (chart === "doughnutchart") {
//                     doughnutchart(element);
//                 } else if (chart === 'scatterplot') {
//                     scatterplot(element);
//                 }
//             } else if (element.type === 'table') {
//                 simpleTableViz(datastory_data.sparql_endpoint, element.table_query, element.table_title, element.position, element.type);
//             }
//         }
//         )
//     }
// }

// function that applies the operation 'count'
// function count(arr) {
//     let elCount = {};
//     for (const item of arr) {
//         if (elCount[item]) {
//             elCount[item] += 1;
//         } else {
//             elCount[item] = 1;
//         }
//     } return elCount;
// }

// function that applies the operation 'order_by'
// function order_by(numArray) {
//     numArray.sort(function (a, b) {
//         return a - b;
//     });
//     return numArray;
// }

// function chartHTMLElements(element) {
//     // create canva for bar chart
//     var chartCanva = document.createElement("canvas");
//     var chartId = "chart_" + element.position;
//     chartCanva.setAttribute("id", chartId);
//
//     // create div that contains canva
//     var chartArea = document.createElement("div");
//     chartArea.className = "chart-container";
//     chartArea.appendChild(chartCanva);
//
//     // create card body div
//     var cardBody = document.createElement("div");
//     cardBody.className = "card-body";
//     cardBody.appendChild(chartArea);
//
//     // create chart title h3 and add element.chart_title as text
//     var chartTitle = document.createElement("h3");
//     chartTitle.className = "card-title";
//     chartTitle.appendChild(document.createTextNode(element.chart_title));
//
//     // create card header
//     var cardHeader = document.createElement("div");
//     // cardHeader.className = "card-header";
//     cardHeader.appendChild(chartTitle);
//
//     // get general container and append elements
//     var container = document.getElementById(element.position);
//     container.appendChild(cardHeader);
//     container.appendChild(cardBody);
// }

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

// function barchart(element) {
//
//
//     // get the data that I need
//     // now starts a piece of code that is exactly the same from function counter
//     // ********
//
//     // where I'll store the data necessary fo the bar chart
//     var chartData = [];
//     var chartLabels = [];
//
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
//             headers: { Accept: 'application/sparql-results+json' },
//             beforeSend: function () { $('#loader').removeClass('hidden') },
//             success: function (returnedJson) {
//
//                 // check if query requires operations
//                 var op = element.operations;
//                 if (op.length > 0) {
//                     var label = [];
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         if (returnedJson.results.bindings[i].label.value == '') {
//                             label[i] = 'Unknown'
//                         } else {
//                             label[i] = returnedJson.results.bindings[i].label.value;
//                         }
//
//                     }
//
//                     op.forEach(o => {
//                         var action = o.action;
//                         var param = o.param;
//                         // activate the operations on the data
//                         if (action.includes('count')) {
//                             var elCount = eval(action + '(' + param + ')');
//                             // where I'll store the data necessary for the chart
//                             chartData = Object.values(elCount);
//                             chartLabels = Object.keys(elCount);
//                         }
//                     })
//                 } else if (op.length == 0) {
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                         chartData[i] = returnedJson.results.bindings[i].count.value;
//                     }
//                 }
//
//                 //  create the HTML structure that'll receive the data
//                 chartHTMLElements(element);
//                 //  retrieve the chart id
//                 var chartId = "chart_" + element.position;
//                 // set colors
//                 var chartColor = datastory_data.color_code[0];
//                 // create image string
//                 var image = '';
//                 var myBarChart = new Chart(chartId, {
//                     type: 'bar',
//                     data: {
//                         labels: chartLabels,
//                         datasets: [{
//                             label: element.chart_series,
//                             backgroundColor: chartColor,
//                             borderColor: chartColor,
//                             data: chartData,
//                         }],
//                     },
//                     options: {
//                         responsive: true,
//                         maintainAspectRatio: true,
//                         scaleShowValues: true,
//                         scales: {
//                             yAxes: [{
//                                 scaleLabel: {
//                                     display: true,
//                                     labelString: element.chart_legend.y
//                                 },
//                                 beginAtZero: true
//                             }],
//                             xAxes: [{
//                                 scaleLabel: {
//                                     display: true,
//                                     labelString: element.chart_legend.x
//                                 },
//                                 ticks: {
//                                     autoSkip: false
//                                 }
//                             }]
//                         },
//                         legend: {
//                             labels: {
//                                 boxWidth: 20,
//                                 padding: 10,
//                             }
//                         },
//                         animation: {
//                             onComplete: function () {
//                                 image = myBarChart.toBase64Image();
//                                 printChart(image, element.position);
//                                 labels = arrayToString(chartLabels);
//                                 exportChart(element.position, 'bar', labels, chartData, 'Quantity');
//                             }
//                         }
//                     }
//                 });
//
//             },
//             complete: function () {
//                 $('#loader').addClass('hidden');
//                 return true;
//             },
//             error: function (xhr, ajaxOptions, thrownError) {
//                 queryError(xhr, ajaxOptions, thrownError);
//             }
//         })
//
//     }
//
// }
//
// function linechart(element) {
//     // get the data that I need
//     // now starts a piece of code that is exactly the same from function counter
//     // ********
//
//     // where I'll store the data necessary fo the bar chart
//     var chartData = [];
//     var chartLabels = [];
//
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
//         // var label = element.label;
//         $.ajax({
//             type: 'GET',
//             url: sparqlEndpoint + '?query=' + encoded,
//             headers: { Accept: 'application/sparql-results+json' },
//             beforeSend: function () { $('#loader').removeClass('hidden') },
//             success: function (returnedJson) {
//
//                 // check if query requires operations
//                 var op = element.operations;
//                 if (op.length > 0) {
//                     var label = [];
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         if (returnedJson.results.bindings[i].label.value == '') {
//                             label[i] = 'Unknown'
//                         } else {
//                             label[i] = returnedJson.results.bindings[i].label.value;
//                         }
//
//                     }
//
//                     op.forEach(o => {
//                         var action = o.action;
//                         var param = o.param;
//                         // activate the operations on the data
//                         if (action.includes('count')) {
//                             var elCount = eval(action + '(' + param + ')');
//                             // where I'll store the data necessary for the chart
//                             chartData = Object.values(elCount);
//                             chartLabels = Object.keys(elCount);
//                         }
//                     })
//                 } else if (op.length == 0) {
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                         chartData[i] = returnedJson.results.bindings[i].count.value;
//                     }
//                 }
//
//                 //  create the HTML structure that'll receive the data
//                 chartHTMLElements(element);
//                 //  retrieve the chart id
//                 var chartId = "chart_" + element.position;
//                 var chartColor = datastory_data.color_code[0];
//                 // graph plotting
//                 var myLineChart = new Chart(chartId, {
//                     type: 'line',
//                     data: {
//                         labels: chartLabels,
//                         datasets: [{
//                             label: element.chart_series,
//                             borderColor: chartColor,
//                             pointBorderColor: "#FFF",
//                             pointBackgroundColor: chartColor,
//                             pointBorderWidth: 2,
//                             pointHoverRadius: 4,
//                             pointHoverBorderWidth: 1,
//                             pointRadius: 4,
//                             backgroundColor: 'transparent',
//                             fill: true,
//                             borderWidth: 2,
//                             data: chartData
//                         }]
//                     },
//                     options: {
//                         responsive: true,
//                         maintainAspectRatio: true,
//                         spanGaps: true,
//                         legend: {
//                             labels: {
//                                 boxWidth: 20,
//                                 padding: 10,
//                             }
//                         },
//                         scaleShowValues: true,
//                         scales: {
//                             yAxes: [{
//                                 scaleLabel: {
//                                     display: true,
//                                     labelString: element.chart_legend.y
//                                 },
//                                 beginAtZero: true
//                             }],
//                             xAxes: [{
//                                 scaleLabel: {
//                                     display: true,
//                                     labelString: element.chart_legend.x
//                                 },
//                                 ticks: {
//                                     autoSkip: false
//                                 }
//                             }]
//                         },
//                         tooltips: {
//                             bodySpacing: 4,
//                             mode: "nearest",
//                             intersect: 0,
//                             position: "nearest",
//                             xPadding: 10,
//                             yPadding: 10,
//                             caretPadding: 10
//                         },
//                         layout: {
//                             padding: { left: 15, right: 15, top: 15, bottom: 15 }
//                         },
//                         animation: {
//                             onComplete: function () {
//                                 image = myLineChart.toBase64Image();
//                                 printChart(image, element.position);
//                                 labels = arrayToString(chartLabels);
//                                 exportChart(element.position, 'line', labels, chartData, 'New Entries');
//                             }
//                         }
//                     }
//                 });
//             },
//             complete: function () {
//                 $('#loader').addClass('hidden');
//                 return true;
//             },
//             error: function (xhr, ajaxOptions, thrownError) {
//                 queryError(xhr, ajaxOptions, thrownError);
//             }
//         })
//     }
//
// }

// function doughnutchart(element) {
//
//     // get the data that I need
//     // now starts a piece of code that is exactly the same from function counter
//     // ********
//
//
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
//
//         $.ajax({
//             type: 'GET',
//             url: sparqlEndpoint + '?query=' + encoded,
//             headers: { Accept: 'application/sparql-results+json' },
//             beforeSend: function () { $('#loader').removeClass('hidden') },
//             success: function (returnedJson) {
//
//                 var chartData = [];
//                 var chartLabels = [];
//
//                 // check if query requires operations
//                 var op = element.operations;
//                 if (op.length > 0) {
//                     var label = [];
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         if (returnedJson.results.bindings[i].label.value == '') {
//                             label[i] = 'Unknown'
//                         } else {
//                             label[i] = returnedJson.results.bindings[i].label.value;
//                         }
//
//                     }
//
//                     op.forEach(o => {
//                         var action = o.action;
//                         var param = o.param;
//                         // activate the operations on the data
//                         if (action.includes('count')) {
//                             var elCount = eval(action + '(' + param + ')');
//                             // where I'll store the data necessary for the chart
//                             chartData = Object.values(elCount);
//                             chartLabels = Object.keys(elCount);
//                         }
//                     })
//                 } else if (op.length == 0) {
//                     for (i = 0; i < returnedJson.results.bindings.length; i++) {
//                         chartData[i] = returnedJson.results.bindings[i].count.value;
//                         if (returnedJson.results.bindings[i].label.value == '') {
//                             chartLabels[i] = 'Unknown'
//                         } else {
//                             chartLabels[i] = returnedJson.results.bindings[i].label.value;
//                         }
//                     }
//                 }
//
//                 // create the HTML structure that'll receive the data
//                 chartHTMLElements(element);
//                 // retrieve the chart id
//                 var chartId = "chart_" + element.position;
//
//                 // chart colors
//                 if (chartLabels.length === 1) {
//                     var colors = datastory_data.color_code[0];
//                 } else {
//                     var colors = chartColor(datastory_data.color_code[0], datastory_data.color_code[1], chartLabels.length);
//                 }
//
//                 // chart plotting
//                 var myDoughnutChart = new Chart(chartId, {
//                     type: 'doughnut',
//                     data: {
//                         datasets: [{
//                             data: chartData,
//                             backgroundColor: colors
//                         }],
//
//                         labels: chartLabels
//                     },
//                     options: {
//                         responsive: true,
//                         maintainAspectRatio: true,
//                         legend: {
//                             position: 'right'
//                         },
//                         layout: {
//                             padding: {
//                                 left: 20,
//                                 right: 20,
//                                 top: 20,
//                                 bottom: 20
//                             }
//                         },
//                         animation: {
//                             onComplete: function () {
//                                 image = myDoughnutChart.toBase64Image();
//                                 printChart(image, element.position);
//                                 labels = arrayToString(chartLabels);
//                                 exportChart(element.position, 'doughnut', labels, chartData);
//                             }
//                         }
//                     }
//                 });
//             },
//             complete: function () {
//                 $('#loader').addClass('hidden');
//                 return true;
//             },
//             error: function (xhr, ajaxOptions, thrownError) {
//                 queryError(xhr, ajaxOptions, thrownError);
//             }
//         })
//     }
//
// }

// function scatterplot(element) {
//     let queryArray = [];
//
//     // check if chart requires extra queries
//     var extra = element.extra_queries;
//     if (extra.length == 0) {
//         // where I'll store the data necessary fo the scatter plot
//         let chartData = [];
//         let tempLabels = [];
//
//         let query = element.chart_query;
//         // check if the query is an API request
//         if (query.startsWith('http')) {
//             alert('There is an API request.');
//             // $.ajax({
//             //     type: 'GET',
//             //     url: query,
//             //     headers: {Accept: 'application/json'},
//             //     success: function (returnedJson) {
//             //         do things
//             //     }
//             // }
//         } else {
//             // if it is a sparql query
//             var encoded = encodeURIComponent(query);
//             var sparqlEndpoint = datastory_data.sparql_endpoint;
//             $.ajax({
//                 type: 'GET',
//                 url: sparqlEndpoint + '?query=' + encoded,
//                 headers: { Accept: 'application/sparql-results+json' },
//                 beforeSend: function () { $('#loader').removeClass('hidden') },
//                 success: function (returnedJson) {
//                     const queryResults = returnedJson.results.bindings;
//                     for (entry in queryResults) {
//                         const xValue = parseInt(queryResults[entry].x.value);
//                         const yValue = parseInt(queryResults[entry].y.value);
//                         const entryObj = { x: xValue, y: yValue }
//                         tempLabels.push(xValue);
//                         chartData.push(entryObj);
//                     }
//
//                     //  create the HTML structure that'll receive the data
//                     chartHTMLElements(element);
//                     //  retrieve the chart id
//                     var chartId = "chart_" + element.position;
//                     var chartColor = datastory_data.color_code[0];
//                     // graph plotting
//                     myScatterChart = new Chart(chartId, {
//                         type: 'scatter',
//                         data: {
//                             datasets: [{
//                                 label: element.chart_series,
//                                 data: chartData,
//                                 backgroundColor: chartColor
//                             }]
//                         },
//                         options: {
//                             responsive: true,
//                             legend: {
//                                 position: 'top',
//                             },
//                             scales: {
//                                 yAxes: [{
//                                     scaleLabel: {
//                                         display: true,
//                                         labelString: element.chart_legend.y
//                                     },
//                                     beginAtZero: true
//                                 }],
//                                 xAxes: [{
//                                     scaleLabel: {
//                                         display: true,
//                                         labelString: element.chart_legend.x
//                                     },
//                                     ticks: {
//                                         autoSkip: false
//                                     }
//                                 }]
//                             },
//                             animation: {
//                                 onComplete: function () {
//                                     image = myScatterChart.toBase64Image();
//                                     printChart(image, element.position);
//                                     exportChart(element.position, 'scatter', chartData);
//                                 }
//                             }
//                         }
//                     });
//                 },
//                 complete: function () {
//                     $('#loader').addClass('hidden');
//                     return true;
//                 },
//                 error: function (xhr, ajaxOptions, thrownError) {
//                     queryError(xhr, ajaxOptions, thrownError);
//                 }
//             })
//         }
//     } else if (extra.length > 0) {
//         let query = element.chart_query;
//         let seriesArray = [];
//         let datasetArray = [];
//         queryArray.push(query);
//         seriesArray.push(element.chart_series);
//
//         for (const e of extra) {
//             queryArray.push(e.extra_query);
//             seriesArray.push(e.extra_series);
//         }
//         // generate colors based on number of queries
//         var colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), queryArray.length);
//
//         for (const [i, q] of queryArray.entries()) {
//             let chart_query = q;
//             let chartData = [];
//             let dataDict = {};
//
//             // check if the query is an API request
//             if (chart_query.startsWith('http')) {
//                 alert('There is an API request.');
//                 // $.ajax({
//                 //     type: 'GET',
//                 //     url: query,
//                 //     headers: {Accept: 'application/json'},
//                 //     success: function (returnedJson) {
//                 //         do things
//                 //     }
//                 // }
//             } else {
//                 // if it is a sparql query
//                 var encoded = encodeURIComponent(chart_query);
//                 var sparqlEndpoint = datastory_data.sparql_endpoint;
//                 $.ajax({
//                     type: 'GET',
//                     url: sparqlEndpoint + '?query=' + encoded,
//                     headers: { Accept: 'application/sparql-results+json' },
//                     beforeSend: function () { $('#loader').removeClass('hidden') },
//                     success: function (returnedJson) {
//                         const queryResults = returnedJson.results.bindings;
//                         for (entry in queryResults) {
//                             const xValue = parseInt(queryResults[entry].x.value);
//                             const yValue = parseInt(queryResults[entry].y.value);
//                             const entryObj = { x: xValue, y: yValue }
//                             chartData.push(entryObj);
//                         }
//                         dataDict.data = chartData;
//                         dataDict.label = seriesArray[i];
//                         dataDict.backgroundColor = colors[i];
//                         datasetArray.push(dataDict);
//                         myScatterChart.update();
//                     },
//                     complete: function () {
//                         $('#loader').addClass('hidden');
//                         return true;
//                     },
//                     error: function (xhr, ajaxOptions, thrownError) {
//                         queryError(xhr, ajaxOptions, thrownError);
//                     }
//                 });
//             }
//         }
//
//         //  create the HTML structure that'll receive the data
//         chartHTMLElements(element);
//         //  retrieve the chart id
//         var chartId = "chart_" + element.position;
//
//         // graph plotting
//         myScatterChart = new Chart(chartId, {
//             type: 'scatter',
//             data: data = {
//                 datasets: datasetArray
//             },
//             options: {
//                 responsive: true,
//                 plugins: {
//                     legend: {
//                         position: 'top',
//                     },
//                     title: {
//                         display: true,
//                         text: element.chart_title
//                     }
//                 },
//                 scales: {
//                     yAxes: [{
//                         scaleLabel: {
//                             display: true,
//                             labelString: element.chart_legend.y
//                         },
//                         beginAtZero: true
//                     }],
//                     xAxes: [{
//                         scaleLabel: {
//                             display: true,
//                             labelString: element.chart_legend.x
//                         },
//                         ticks: {
//                             autoSkip: false
//                         }
//                     }]
//                 },
//                 animation: {
//                     onComplete: function () {
//                         image = myScatterChart.toBase64Image();
//                         printChart(image, element.position);
//                         exportChart(element.position, 'scatter', datasetArray);
//                     }
//                 }
//             }
//         });
//     }
// }

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
//             headers: { Accept: 'application/sparql-results+json' },
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


// STATISTICS TABLE
function createSimpleTable(table_title, returnedJson, pos, type) {
    var tabletoappend = "<caption class='resulttable_caption' \
	style='color: white'>"+ decodeURIComponent(table_title) + "\
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
                // var buttons = addActionButton(actions, headings[j], pos, res_value, res_label);
                tabletoappend += "</td>";
            }
            else {
                tabletoappend += "<td>";
                tabletoappend += "<span class='table_result'>" + res_value + "</span>";
                // var buttons = addActionButton(actions, headings[j], pos, res_value, res_value);
                tabletoappend += "</td>";
            }
        }
        tabletoappend += "</tr>";
    }
    $("#" + pos + "__table tr").detach();
    $("#" + pos + "__table caption").detach();
    $("#" + pos + "__table").append(tabletoappend);
    if (type.length > 0) {
        exportTableHtml(pos, type);
        exportTableCsv(pos, type, table_title);
    }

}

function simpleTableViz(sparqlEndpoint, table_query, table_title, pos, type = '') {
    var encoded_table = encodeURIComponent(table_query);
    $.ajax({
        type: 'GET',
        url: sparqlEndpoint + '?query=' + encoded_table,
        headers: { Accept: 'application/sparql-results+json' },
        beforeSend: function () { $('#loader').removeClass('hidden') },
        success: function (returnedJson) {
            createSimpleTable(table_title, returnedJson, pos, type);
        },
        complete: function () {
            $('#loader').addClass('hidden');
            return true;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            queryError(xhr, ajaxOptions, thrownError);
        }
    });

}

// export table HTML
function exportTableHtml(position, type) {
    var export_btn;
    var tableHtml;
    if (type && type.includes('table')) {
        export_btn = document.getElementById('export_' + position);
        table = document.getElementById(position + '__table');
        var cloneTable = table.cloneNode(true);
        cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
        tableHtml = cloneTable.innerHTML;
    } else if (type && type.includes('textsearch')) {
        export_btn = document.getElementById('export_' + position);
        table = document.getElementById(position + '__textsearchid');
        var cloneTable = table.cloneNode(true);
        cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
        // remove action buttons
        var uselessEl = cloneTable.querySelectorAll('.action_button');
        uselessEl.forEach(el => {
            el.remove();
        })
        // remove span buttons
        cloneTable.querySelector('.caret').remove();
        cloneTable.querySelector('.closetable').remove();
        cloneTable.querySelector('#export_' + position).remove();
        tableHtml = cloneTable.innerHTML;
    }
    export_btn.onclick = function () {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", '<table>' + tableHtml + '</table>');
    }

}

// export table CSV
// reference: https://stackoverflow.com/questions/15547198/export-html-table-to-csv-using-vanilla-javascript
function exportTableCsv(position, type, title) {
    export_btn = document.getElementById('csv_' + position);
    var table_id = '';
    var csv = [];
    if (type && type.includes('table')) {
        table_id = position + '__table';
        var cloneTable = table.cloneNode(true);
        cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
        csv = createCsv(cloneTable);
    } else if (type && type.includes('textsearch')) {
        table_id = position + '__textsearchid';
        var cloneTable = table.cloneNode(true);
        cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
        // remove action buttons
        var uselessEl = cloneTable.querySelectorAll('.action_button');
        uselessEl.forEach(el => {
            el.remove();
        })
        // remove span buttons
        cloneTable.querySelector('.caret').remove();
        cloneTable.querySelector('.closetable').remove();
        cloneTable.querySelector('#export_' + position).remove();
        csv = createCsv(cloneTable);
    }

    var csv_string = csv.join('\n');
    var cleanTitle = decodeURIComponent(title);
    // Download it
    var filename = 'export_' + cleanString(cleanTitle) + '.csv';
    export_btn.onclick = function () {
        export_btn.setAttribute('target', '_blank');
        export_btn.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
        export_btn.setAttribute('download', filename);
    }
}

// construct csv
function createCsv(table, separator = ',') {
    // Select rows from table_id
    var rows = table.rows;
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ').trim();
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    return csv;
}

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
    let file_name = cleanString(title);
    a.setAttribute('class', 'dropdown-item');
    a.setAttribute('href', '/melody/modify/' + id + '/' + file_name);
    a.appendChild(aContent);
    return a;
}

const cleanString = (dirtyString) => {
    let cleanedString;
    // remove extra white spaces at beginning and end
    cleanedString = dirtyString.trim();
    // remove special characters
    cleanedString = cleanedString.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
    // replace accented letters
    cleanedString = cleanedString.normalize("NFD").replace(/\p{Diacritic}/gu, '');
    // remove multiple white spaces
    cleanedString = cleanedString.replace(/\s+/g, ' ');
    // replace white space with '_' and lowercase
    cleanedString = cleanedString.replace(/[^\w]/g, '_').toLowerCase();
    return cleanedString;
}

////// TEXT EDITOR
// Initialize Quill editor
const createTextEditor = () => {
    let quill;
    let editors = document.querySelectorAll('.editor');
    for (const [key, value] of Object.entries(editors)) {
        let pos = value.id.split('__')[0];
        let name = value.previousElementSibling.id.split('__')[1];
        if (value.children.length != 3) {
            quill = new Quill(value, {
                modules: {
                    toolbar: toolbarOptions()
                },
                theme: 'snow'
            });
        }
        fromEditorToInput(pos);
    }
}

const toolbarOptions = () => {
    let toolbarOptions = [];
    toolbarOptions = [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        ['link'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ]

    return toolbarOptions;
}

const fromEditorToInput = (pos) => {
    let editor = document.getElementById(pos + '__editor');
    editor.onmouseleave = function () {
        let qlEditor = editor.childNodes[0];
        let textContent = qlEditor.innerHTML;
        let input = editor.parentNode.querySelector('input');
        input.setAttribute('value', textContent);
    }
}


///// MODIFY CSS
const overwriteCSS = () => {
    const style = document.createElement('style');

    style.textContent = `
        .main-header, .sidebar {
            display: block;
        }

        .main-panel {
            width: calc(100% - 250px);
        }`;

    document.head.appendChild(style);
}
