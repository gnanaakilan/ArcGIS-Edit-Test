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
], function(
    Map,FeatureLayer,TemplatePicker,Draw,Graphic,Edit,geometryEngine,Query,
    SimpleFillSymbol,Color,InfoTemplate) {

        window.Map = Map
        window.FeatureLayer = FeatureLayer
        window.TemplatePicker = TemplatePicker
        window.Draw = Draw
        window.Graphic = Graphic
        window.Edit = Edit
        window.geometryEngine = geometryEngine
        window.Query = Query
        window.SimpleFillSymbol = SimpleFillSymbol
        window.Color = Color
        window.InfoTemplate = InfoTemplate

})