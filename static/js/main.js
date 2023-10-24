addEventListener("DOMContentLoaded", function () {
    if (Object.getOwnPropertyNames(datastory_data).length > 0) {
        colorSwitch(datastory_data.color_code[0], datastory_data.color_code[1]);
    }
});

window.onload = function () { disableKeypress(); }

$(document).ready(function () {
    // change font color in secondary menu
    $(".navbar-toggler.sidenav-toggler.ml-auto").attr('aria-expanded', 'false');
    if (Object.getOwnPropertyNames(datastory_data).length > 0) {
        getBrightness(datastory_data.color_code[1]);
    }
    // auto grow text areas
    $("textarea").each(function () {
        this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
    }).on("input", function () {
        this.style.height = 0;
        this.style.height = (this.scrollHeight) + "px";
    });

});

// check for drop down story list and call function
const storyList = document.getElementById('story-list');
if (storyList) { fillDropDownList(storyList); }

function auto_grow(element) { }

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

function detach_table(index) {
    document.getElementById(index + "__textsearchresults").innerHTML = '&nbsp;';
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
    // if (typeof (mapSidebar) != undefined && mapSidebar != null) {
    //     mapSidebar.forEach(gradientbackground);
    // }
    // if (typeof (mapSidebarTab) != undefined && mapSidebarTab != null) {
    //     mapSidebarTab.forEach(monchromebackground);
    // }

    function borders(el) {
        el.style.border = "solid 2px " + color_1;
        el.style.color = color_1;
    }
    counters.forEach(borders);

}

// colors for charts
function chartColor(colorStart, colorEnd, dataLength) {
    return d3.quantize(d3.interpolateHcl(colorStart, colorEnd), dataLength);
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
    var htmlcopy = html.replaceAll('/melody/static', 'static');
    var thishtml = encodeURIComponent(htmlcopy);
    el.href = 'data:text/html;charset=UTF-8,' + thishtml;
    window.open('../static/static.zip');
}

// function saveHTML(name) {
//     var html = document.documentElement.outerHTML;
//     var htmlcopy = html.replaceAll('/static', 'static');
//     var thishtml = encodeURIComponent(htmlcopy);
//     saveAs(thishtml, name + '.html');
// }

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
// const createTextEditor = () => {
//     let quill;
//     let editors = document.querySelectorAll('.editor');
//     for (const [key, value] of Object.entries(editors)) {
//         let pos = value.id.split('__')[0];
//         let name = value.previousElementSibling.id.split('__')[1];
//         if (value.children.length != 3) {
//             quill = new Quill(value, {
//                 modules: {
//                     toolbar: toolbarOptions()
//                 },
//                 theme: 'snow'
//             });
//         }
//         fromEditorToInput(pos);
//     }
// }

// const toolbarOptions = () => {
//     let toolbarOptions = [];
//     toolbarOptions = [
//         [{ 'header': [2, 3, false] }],
//         ['bold', 'italic', 'underline'],
//         ['link'],
//         [{ 'list': 'ordered' }, { 'list': 'bullet' }],
//         ['clean']
//     ]

//     return toolbarOptions;
// }

// const fromEditorToInput = (pos) => {
//     let editor = document.getElementById(pos + '__editor');
//     editor.onmouseleave = function () {
//         let qlEditor = editor.childNodes[0];
//         let textContent = qlEditor.innerHTML;
//         let input = editor.parentNode.querySelector('input');
//         input.setAttribute('value', textContent);
//     }
// }


///// MODIFY CSS
const overwriteCSS = () => {
    if (!(window.location.href).includes('published_stories')) {
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
}
