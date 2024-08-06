import { DragDropContext, DropResult } from "react-beautiful-dnd";

interface DragAndDropProviderProps {
    children: React.ReactNode;
    onDragEnd: (result: DropResult) => void;
}


export function DragAndDropProvider({ children }: DragAndDropProviderProps) {
    return (
        <DragDropContext onDragEnd={(result) => console.log(result)}>
            {children}
        </DragDropContext>
    );
}
