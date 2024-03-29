import { type CreatePostInput, type Post } from "../../API";
import { Paper, IconButton } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ClearIcon from "@mui/icons-material/Clear";
import { Image } from "@aws-amplify/ui-react";

interface PostComponentProps {
  post: Post | CreatePostInput;
  index: number;
  hoveredButtons: boolean[];
  handleMouseEnter: (index: number) => void;
  handleMouseLeave: (index: number) => void;
  handleLike: (index: number) => void;
  removePost: (id: string | null | undefined) => void;
}

const PostComponent: React.FC<PostComponentProps> = ({
  post,
  index,
  hoveredButtons,
  handleMouseEnter,
  handleMouseLeave,
  handleLike,
  removePost,
}) => {
  return (
    <Paper
      variant="outlined"
      square={false}
      key={post.id ? post.id : index}
      className="post"
    >
      <div className="imageContainer">
        {post.filePath && (
          <Image
            src={post.filePath}
            style={{
              width: 150,
            }}
            alt={`Image for ${post.title}`}
          />
        )}
      </div>
      <p className="title">{post.title}</p>
      <p className="content">{post.content}</p>
      <div className="likeContainer">
        <div className="likeInfo">
          <IconButton
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={() => handleMouseLeave(index)}
            onClick={() => handleLike(index)}
          >
            {hoveredButtons[index] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <p>{post.like}</p>
        </div>
        <IconButton
          onClick={() => removePost(post.id)}
          className="deleteButton"
        >
          <ClearIcon />
        </IconButton>
      </div>
    </Paper>
  );
};

export default PostComponent;
