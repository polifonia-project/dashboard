window.onload = function () {
    var sparqlEndpoint = data.sparql_endpoint;
    var counts = data.count;

    counts.forEach(element => {
        var sparqlQuery = element.query;
        console.log(sparqlQuery);
        var encoded = encodeURIComponent(sparqlQuery);
        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {
                for (j = 0; j < returnedJson.results.bindings.length; j++) {
                    var count = returnedJson.results.bindings[j].count.value;
                    var container = document.getElementById("first");
                    var div = document.createElement("div");
                    div.className = "done";
                    div.appendChild(document.createTextNode(count));
                    container.appendChild(div);
                }
            }
        })
    })

}