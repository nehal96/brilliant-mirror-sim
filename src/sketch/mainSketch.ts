import p5 from "p5";
import { SceneConfig } from "@/lib/types";

// Define the props structure the sketch expects
interface SketchProps {
  sceneConfig: SceneConfig;
}

export const sketch = (p: p5) => {
  let currentSceneConfig: SceneConfig | null = null;

  // Function for React component to update sketch props
  p.updateWithProps = (props: SketchProps) => {
    if (props.sceneConfig) {
      currentSceneConfig = props.sceneConfig;
    }
  };

  p.setup = () => {
    p.createCanvas(600, 400); // Default canvas size
    p.background(230); // Light grey background
    console.log("p5 setup complete");
    // p.noLoop(); // Uncomment if the sketch should only draw once initially
  };

  p.draw = () => {
    p.background(230); // Clear background on each frame
  };
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
