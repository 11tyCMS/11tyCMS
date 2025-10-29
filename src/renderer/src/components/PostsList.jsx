import { useState, useRef, useEffect } from 'react'
import AddFileDialog from './Dialogs/AddFileDialog'
import FeatherIcon from 'feather-icons-react'
import DeletePostDialog from './Dialogs/DeletePostDialog'
import { useNavigate } from 'react-router-dom'
function PostsList({ collection, posts, setSelectedFile, cwd }) {
  const [displayAddFileDialog, setDisplayAddFileDialog] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null);
  console.log(posts);
  const navigate = useNavigate();
  const fetchFile = (fileName) => {
    window.api.openFile(fileName).then((fileContents) => {
      setSelectedFile({
        contents: fileContents.content,
        data: fileContents.data,
        content: fileContents.content,
        fileName,
      })
    })
  }
  const deletePostConfirm = (event, post) => {
    event.stopPropagation();
    setPostToDelete(post);
  }
  return (
    <div className="postsList">
      <AddFileDialog
        displayStatus={displayAddFileDialog}
        setDisplayStatus={setDisplayAddFileDialog}
        fetchFile={fetchFile}
        collection={collection}
        cwd={cwd}
      />
      <DeletePostDialog
        post={postToDelete}
        setPostToDelete={setPostToDelete} />
      <div className='head-container'>
        <h1>{collection}</h1>
        <FeatherIcon icon={"plus"} size={25} color="#7c8ad6" className='add-button' onClick={() => setDisplayAddFileDialog(!displayAddFileDialog)} />
      </div>
      <ul>
        {posts
          .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
          .map((post) => (
            <li onClick={() => {navigate(`/${collection}/posts/${post.name}`)}}>
              <label>{post.data.title ? post.data.title : post.path}</label>
              <div className='buttons-info'>
                <span style={{ justifySelf: 'end' }}>
                  {new Date(post.data.date).toLocaleDateString('en-US')}
                </span>
                <button className='icon' onClick={(e) => deletePostConfirm(e, post)}>
                  <FeatherIcon icon='trash' size={16} />
                </button>
              </div>

            </li>
          ))}
      </ul>
    </div>
  )
}

export default PostsList
