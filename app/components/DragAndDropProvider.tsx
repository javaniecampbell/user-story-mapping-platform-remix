import { DragDropContext, DropResult } from "react-beautiful-dnd";

interface DragAndDropProviderProps {
    children: React.ReactNode;
    onDragEnd: (result: DropResult) => void;
}


export function DragAndDropProvider({ children , onDragEnd }: DragAndDropProviderProps) {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {children}
        </DragDropContext>
    );
}
