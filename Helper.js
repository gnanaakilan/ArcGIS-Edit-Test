
function disableTemplatePicker(){
    TemplatePicker.clearSelection()
    disableDrawTool()
}

function disableDrawTool(){
    DrawTool.deactivate()
}

function disableEditTool(){
    EditTool.deactivate();
}