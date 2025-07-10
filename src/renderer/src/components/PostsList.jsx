import { useState, useRef, useEffect } from 'react'
import AddFileDialog from './AddFileDialog'
import { MDXEditor } from '@mdxeditor/editor'
import FeatherIcon from 'feather-icons-react'
function PostsList({ collection, posts, setSelectedFile, fetchFile, cwd }) {
  const [displayAddFileDialog, setDisplayAddFileDialog] = useState(false)
  console.log(posts, 'tesd')
  return (
    <div className="postsList">
      <AddFileDialog
        displayStatus={displayAddFileDialog}
        setDisplayStatus={setDisplayAddFileDialog}
        fetchFile={fetchFile}
        collection={collection}
        cwd={cwd}
      ></AddFileDialog>
      <div className='head-container'>
        <h1>{collection}</h1>
        <FeatherIcon icon={"plus"} size={25} color="#7c8ad6" className='add-button' onClick={() => setDisplayAddFileDialog(!displayAddFileDialog)}/>
      </div>
      <ul>
        {posts
          .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
          .map((post) => (
            <li onClick={() => fetchFile(post.path)}>
              <label>{post.data.title ? post.data.title : post.path}</label>
              <span style={{ justifySelf: 'end' }}>
                {new Date(post.data.date).toLocaleDateString('en-US')}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}

export default PostsList
