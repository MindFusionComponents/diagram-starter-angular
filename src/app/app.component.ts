import { Component, ViewChild } from '@angular/core';
import * as Drawing from '@mindfusion/drawing';
import * as Diagramming from '@mindfusion/diagramming';
import { DiagramView } from '@mindfusion/diagramming-angular';
import { DiagrammingAngularModule, PaletteItem } from '@mindfusion/diagramming-angular';

@Component({
  selector: 'app-root',
  imports: [DiagrammingAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild(DiagramView) diagramViewControl!: DiagramView;
  diagram!: Diagramming.Diagram;
  paletteItems: PaletteItem[] = [];
  paletteItems1: PaletteItem[] = [];
  paletteItems2: PaletteItem[] = [];
  json: string = '';

  public ngOnInit() {
    this.diagram = new Diagramming.Diagram();
    this.diagram.bounds = new Drawing.Rect(0, 0, 1000, 1000);

    // you can create diagram items from code;
    // alternative syntax is diagram.addItem(new ShapeNode());
    var node1 = this.diagram.factory.createShapeNode(10, 10, 30, 30);
    node1.text = "Hello";

    var node2 = this.diagram.factory.createShapeNode(60, 25, 30, 30);
    node2.text = "World";

    this.diagram.factory.createDiagramLink(node1, node2);

    //styling
    var theme = new Diagramming.Theme();
    var shapeNodeStyle = new Diagramming.Style();
    shapeNodeStyle.brush = { type: 'SolidBrush', color: '#e0e9e9' };
    shapeNodeStyle.stroke = '#7F7F7F';
    shapeNodeStyle.fontName = 'Verdana';
    shapeNodeStyle.fontSize = 4;
    shapeNodeStyle.nodeEffects = [new Diagramming.GlassEffect()];
    theme.styles.set('std:ShapeNode', shapeNodeStyle);
    this.diagram.theme = theme;

    // stock shape geometries are listed here:
    // https://www.mindfusion.eu/onlinehelp/jsdiagram/CC_refTable_of_Predefined_Shapes_4.htm

    // use the shape designer tool to draw custom shape geometries:
    // https://mindfusion.eu/tools/shape-designer.html

    // apart from ShapeNode, you could also add TableNode or ContainerNode objects
    var shapes = ["Start", "Input", "Process", "Decision"]
    for (let i = 0; i < shapes.length; ++i) {
      let node = new Diagramming.ShapeNode();
      node.shape = shapes[i];
      node.style = shapeNodeStyle;
      this.paletteItems.push(new PaletteItem(node, shapes[i]));
    }

    shapes = ["Database", "Input", "Delay", "Document", "ManualOperation"];
    for (let i = 0; i < shapes.length; ++i) {
      let node = new Diagramming.ShapeNode();
      node.shape = shapes[i];
      node.style = shapeNodeStyle;
      this.paletteItems1.push(new PaletteItem(node, shapes[i]));
    }


    shapes = ["BpmnStartLink", "BpmnIntermediateLink", "BpmnEndLink",
      "BpmnStartMessage", "BpmnIntermediateMessage", "BpmnEndMessage"];
    for (let i = 0; i < shapes.length; ++i) {
      let node = new Diagramming.ShapeNode();
      node.shape = shapes[i];
      node.style = shapeNodeStyle;
      this.paletteItems2.push(new PaletteItem(node, shapes[i]));
    }
  }
  // detect user's actions by handling diagram events, such as nodeCreated
  public onNodeCreated(event: any) {
    console.log("user has created a node");
    event.args.node.brush = "lightblue";
  }

  // validation events let us prevent users' actions; for example,
  // onLinkCreating handler below prevents users from drawing a cycle
  public onLinkCreating(event: any) {
    if (event.args.destination == null) {
      // not pointing to a node yet
      return;
    }

    var pathFinder = new Diagramming.PathFinder(this.diagram);
    var path = pathFinder.findShortestPath(
      event.args.destination, event.args.origin);

    if (path != null) {
      // adding this new link would create a cycle
      // [origin]--[dest]--[path internal nodes]--[origin]

      event.args.cancel = true;
    }
  }

  public onNewClick() {
    this.diagram.clearAll();
  }

  insecureContextMessage() { return 'The File System API is not available in this context. Please run the page from a web server (npm start).'; }

  public async onSaveClick() {
    try {
      // in this example we store diagram JSON files on local file system;
      // alternatively you could send JSON to server-side using fetch API, e.g.
      // fetch('api_url', { method: 'POST', ... }
      const json = this.diagram.toJson();

      // file system API is not fully supported in some browsers yet
      if (window.showSaveFilePicker) {
        if (!window.isSecureContext) {
          alert(this.insecureContextMessage());
          return;
        }

        const handle = await window.showSaveFilePicker(
          {
            startIn: 'documents',
            suggestedName: 'diagram.json',
            types: [{
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            }],
          });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
      }
      else {
        // work-around for browsers that do not support file system
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
    catch (err) {
      if (typeof err === "string") {
        console.error(err);
      } else if (err instanceof Error) {
        console.error(err.name, err.message);
      }
    }
  }

  public async onLoadClick() {
    try {
      // in this example we store diagram JSON files on local file system;
      // alternatively you could load JSON from server-side using fetch API, e.g.
      // fetch('api_url', { method: 'GET', ... }

      // file system API is not fully supported in some browsers yet
      if (window.showOpenFilePicker) {
        if (!window.isSecureContext) {
          alert(this.insecureContextMessage());
          return;
        }

        const [handle] = await window.showOpenFilePicker(
          {
            startIn: 'documents',
            types: [{
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            }],
          });
        const file = await handle.getFile();
        const content = await file.text();
        this.diagram.fromJson(content);
      }
      else {
        // work-around for browsers that do not support file system
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
          if (e.target != null) {
            var t = (<HTMLInputElement>e.target);
            const file = t.files![0];
            const content = await file.text();
            this.diagram.fromJson(content);
          }
        };
        input.click();
      }
    }
    catch (err) {
      if (typeof err === "string") {
        console.error(err);
      } else if (err instanceof Error) {
        console.error(err.name, err.message);
      }
    }
  }

}
