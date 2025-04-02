
let Map, DrawTool, EditTool, TemplatePicker, GeometryEngine;
let FeatureLayers = []

//Patching single click on double click
let doubleClicked = 0


require([
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/dijit/editing/TemplatePicker",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/toolbars/edit",
    "esri/geometry/geometryEngine",
    "esri/tasks/query",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/InfoTemplate"
], function (
    EsriMap, FeatureLayer, EsriTemplatePicker, Draw, Graphic, Edit, geometryEngine, Query,
    SimpleFillSymbol, Color, InfoTemplate) {

    GeometryEngine = geometryEngine

    // Init map
    Map = new EsriMap("map", {
        logo: false,
        showAttribution: false,
        isDoubleClickZoom: false,
        isClickRecenter: false,
        showInfoWindowOnClick: false,
        basemap: "streets",
        center: [-122.45, 37.75],
        zoom: 13
    })

    // Listen for map loaded
    Map.on("load", onMapLoad)

    // Listen for layer added
    Map.on("layers-add-result", onLayerAdded)



    // Feature layer to add on map
    FeatureLayers = [
        new FeatureLayer("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/9", {
            outFields: ["*"],
            id: "Layer_Military"
        })
    ]
    Map.addLayers(FeatureLayers)


    // Init tool for drawing and editing vectors of graphics
    DrawTool = new Draw(Map)
    DrawTool.on("draw-end", onDrawComplete)

    EditTool = new Edit(Map)
    EditTool.on("deactivate", onEditorDeactivate)


    // Initialize template picker
    TemplatePicker = new EsriTemplatePicker({
        featureLayers: FeatureLayers, rows: "auto", columns: 2,
        grouping: true, style: "height: auto; overflow: auto;"
    }, "temp_picker");
    TemplatePicker.startup();
    TemplatePicker.on("selection-change", onPickerSelectionChange)
})


function onMapLoad({ map }) {

    // Add edit action button on infowindow
    var editaction = {
        title: "Edit",
        className: "edit-action",
        callback: (evt) => onEditBtnClicked(evt)
    };
    map.infoWindow.addActions([editaction]);

}



function onLayerAdded({ layers: res }) {

    // Set selection symbol
    let fl_selection_symbol = new esri.symbol.SimpleFillSymbol().setColor(new esri.Color([255, 255, 0, 0.5]))
    FeatureLayers[0].setSelectionSymbol(fl_selection_symbol);


    // Add evenets to those layer which is 
    // successfully added on map
    res.forEach(obj => {
        if (obj.success) {
            obj.layer.on("click", onLayerClick)
            obj.layer.on("dbl-click", onLayerDoubleClick)
            obj.layer.on("edits-complete", onGraphicEditComplete)
        }
    })


    /** Create merge button inside template picker */

    // create button element
    let btn = document.createElement("button")
    btn.classList.add("merge-btn")
    btn.innerHTML = "Merge Geometry"

    // appending to the template picker box
    document.querySelector("#temp_picker").appendChild(btn)

    btn.addEventListener("click", onMergeBtnClicked)

}

function onLayerClick({ mapPoint, ctrlKey, shiftKey, graphic, screenPoint }) {
    let layer = graphic.getLayer()

    // If drawtool is active
    // do not do anything
    if (DrawTool._geometryType != null) return;

    setTimeout(() => {

        if (doubleClicked > 0) {
            doubleClicked--;
            return
        };

        let query = new esri.tasks.Query()
        query.geometry = mapPoint;

        if (ctrlKey === true) {
            layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_ADD)
        }
        else if (shiftKey === true) {
            layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_SUBTRACT)
        }
        else {
            //layer.selectFeatures(query,FeatureLayer.SELECTION_NEW)

            // Show info window
            let attr = graphic.attributes
            let content = Object.keys(attr).map(key =>
                `<b>${key.toUpperCase()}</b>: ${attr[key]}`
            ).join("<br>")


            let template = new esri.InfoTemplate();
            template.setTitle(layer.name);
            template.setContent(content);
            layer.setInfoTemplate(template);

            // map.infoWindow.setContent(content);
            // map.infoWindow.setTitle(fl.name);
            Map.infoWindow.setFeatures([graphic])
            Map.infoWindow.show(screenPoint, Map.getInfoWindowAnchor(screenPoint));
        }

    }, 500);
}

function onLayerDoubleClick({ graphic }) {
    let layer = graphic.getLayer()

    // If drawtool is active, do not continue
    if (DrawTool._geometryType != null) return;

    doubleClicked = 2
    EditTool.activate(2, graphic);
}




function onDrawComplete({ geometry }) {

    // Get the layer selected in template picker
    let layer = TemplatePicker.getSelected().featureLayer

    // Add the graphic data which is drawn on map
    layer.applyEdits([new esri.Graphic(geometry)], null, null);
}

function onEditorDeactivate({ graphic }) {
    let layer = graphic.getLayer()
    layer.applyEdits(null, [graphic], null);
}

function onGraphicEditComplete({ adds, deletes, updates, target: featureLayer }) {

}

function onPickerSelectionChange() {

    EditTool.deactivate();

    // Let user draw only when any picker is selected
    if (TemplatePicker.getSelected()) {
        DrawTool.activate('polygon')
    }
    else {
        DrawTool.deactivate()
    }

}




function onEditBtnClicked(evt) {

    let selected_feature = Map.infoWindow.getSelectedFeature(),
        attrWindow_node = document.querySelector("#attribute_update"),
        attrWindow_tablenode = document.querySelector("#editor-content")

    let layer = selected_feature.getLayer(),
        fields = layer.fields,
        attrs = selected_feature.attributes

    let query = new esri.tasks.Query()
    query.where = "objectid = " + attrs["objectid"];
    layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW)

    fields.forEach(field => {

        let row = `
            <tr>
                <td>${field.name.toUpperCase()}</td>
                <td>
                    <input type="text" name="${field.name}" value="${attrs[field.name] || ""}" ${!field.editable ? "disabled" : ""} />
                </td>
            <tr>
        `
        attrWindow_tablenode.innerHTML += row

    })

    attrWindow_node.classList.add("show")
    attrWindow_node.layer = layer

    Map.infoWindow.hide()
}

function UpdateAttribute() {
    let attrWindow_node = document.querySelector("#attribute_update"),
        layer = attrWindow_node.layer,
        inputs = attrWindow_node.querySelectorAll("input")

    let obj = [...inputs].reduce((acc, input) => {
        acc[input.name] = input.value
        return acc
    }, {})

    console.log(obj)
}

function onMergeBtnClicked(evt) {

    FeatureLayers.forEach(fl => {
        let graphics = fl.getSelectedFeatures()

        if (graphics.length > 0) {
            let geometries = graphics.map(f => f.geometry)
            let union = GeometryEngine.union(geometries);
            fl.applyEdits([new esri.Graphic(union)], null, graphics)
        }
    })

}



// Export pdf

function getLayerData(callback) {

    let query = new esri.tasks.Query()
    query.outFields = ["*"]
    query.returnGeometry = false
    query.where = "1=1"
    query.orderByFields = ["objectid"]


    FeatureLayers[0].queryFeatures(query, featureset => {
        let attr = featureset.features.map(f => f.attributes)
        callback(attr)
    })
}

function Export() {

    document.querySelector("#map_zoom_slider").setAttribute("data-html2canvas-ignore", "")
    document.querySelector("#temp_picker").setAttribute("data-html2canvas-ignore", "")

    html2canvas(document.body, {
        allowTaint: true,
        useCORS: true
    }).then(canvas => {

        let imgData = canvas.toDataURL('image/png'),
            doc = new jspdf.jsPDF({ format: 'a4' });

        function getXOffsetForText(text) {
            return (doc.internal.pageSize.width / 2) - (doc.getStringUnitWidth(text) * doc.internal.getFontSize() / 2)
        }

        doc.text("Map", getXOffsetForText("Map"), 10);
        doc.addImage(imgData, 'PNG', 10, 20, 190, 150);
        doc.text("Features Details", getXOffsetForText("Features Details"), 190);

        getLayerData(attrs => {
            doc.autoTable({
                head: [Object.keys(attrs[0])],
                body: attrs.map(a => Object.values(a)),
                startY: 200
            })

            doc.save('Map.pdf');
        })
    });
}

document.addEventListener("keydown", ({ keyCode }) => {

    // On delete button click
    if (keyCode == 46) {
        FeatureLayers.forEach(fl => {
            let graphics = fl.getSelectedFeatures()
            if (graphics.length > 0)
                fl.applyEdits(null, null, graphics);
        })
    }

    // On escape button clicked
    else if (keyCode == 27) {
        TemplatePicker.clearSelection()
        EditTool.deactivate();
        FeatureLayers.forEach(fl => {
            fl.clearSelection()
        })
    }

})


