window.onload = function () {
    var sparqlEndpoint = data.sparql_endpoint;
    var sparqlQuery = data.count1;
    var encoded = encodeURIComponent(sparqlQuery);
    $.ajax({
        type: 'GET',
        url: sparqlEndpoint + '?query=' + encoded,
        headers: { Accept: 'application/sparql-results+json; charset=utf-8'},
        success: function (returnedJson) {
            for (i = 0; i < returnedJson.results.bindings.length; i++) {
                var count = returnedJson.results.bindings[i].count.value;
                // exclude named graphs from results
                var container = document.getElementById("first");
                var div = document.createElement("div");
                div.className = "done";
                div.appendChild(document.createTextNode(count));
                container.appendChild(div);
            }
        }
    })
}
// inside ajax request    url: sparqlEndpoint +'?query=' + encoded
// return countResult

//// create div inside div with countResult as text