let node_tp = document.querySelector("#temp_picker"),
node_attr_updator = document.querySelector("#attribute_update"),
node_attr_table = document.querySelector("#editor-content");


function showAttributeUpdator(show){
    if(show)
        node_attr_updator.classList.add("show")
    else
        node_attr_updator.classList.remove("show")
}


function Export(){

    document.querySelector("#map_zoom_slider").setAttribute("data-html2canvas-ignore","")
    document.querySelector("#temp_picker").setAttribute("data-html2canvas-ignore","")

    html2canvas(document.body, {
        allowTaint : true,
        useCORS : true
    }).then(canvas => {

        let imgData = canvas.toDataURL('image/png'),
        doc = new jspdf.jsPDF({ format: 'a4' });

        function getXOffsetForText(text){
            return (doc.internal.pageSize.width / 2) - (doc.getStringUnitWidth(text) * doc.internal.getFontSize() / 2)
        }

        doc.text("Map", getXOffsetForText("Map"), 10);
        doc.addImage(imgData, 'PNG', 10, 20, 190, 150);
        doc.text("Features Details", getXOffsetForText("Features Details"), 190);

        getLayerData(attrs => {
            doc.autoTable({
                head: [Object.keys(attrs[0])],
                body: attrs.map(a => Object.values(a)),
                startY : 200
            })

            doc.save('Map.pdf');
        })
    });
} 