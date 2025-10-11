// components/Interview/DiagramDesignPhase/types.ts

export interface DiagramComponent {
    id: string
    name: string
    icon: string
  }
  
  export interface DraggingState {
    component: DiagramComponent
    x: number
    y: number
  }
  