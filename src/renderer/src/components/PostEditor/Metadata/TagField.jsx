import FeatherIcon from "feather-icons-react";
import { useRef, useState } from "react";

const TagField = ({tags, setTags})=>{
    const inputRef = useRef();
    const [inputValue, setInputValue] = useState('');
    const deleteTagAtIndex = (indexToDelete)=>setTags(tags.filter((val, tagIndex)=>tagIndex != indexToDelete));
    const addTag = (value)=>setTags([...tags, value]);
    const keyDownHandler = (event)=>{
        if(["Comma", "Enter", "Enter Key"].includes(event.code) && inputValue.length){
            addTag(inputValue);
            setInputValue("");
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if(event.code == "Backspace"){
            if(tags.length < 1 || inputRef.current.value.length > 0)
                return
            const updatedTags = [...tags];
            updatedTags.pop();
            setTags(updatedTags);
        }
    }
    const renderTagValue = (value, index)=>{
        return <div className="tagItem">
            <span>{value}</span>
            <button onClick={()=>deleteTagAtIndex(index)}><FeatherIcon icon="delete" size={12}/></button>
        </div>
    }
    return <div className="tagEditor editing">
        {tags.map((item, index)=>renderTagValue(item, index))}
        <input ref={inputRef} placeholder="Value" onKeyDown={keyDownHandler} onChange={({target})=>setInputValue(target.value)} value={inputValue}/>
    </div>
}

export default TagField;