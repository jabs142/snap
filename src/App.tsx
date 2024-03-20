import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { createPost, updatePost } from "./graphql/mutations";
// import {deletePost } from "./graphql/mutations";
import { listPosts } from "./graphql/queries";
import { type CreatePostInput, type Post } from "./API";
import { uploadData, getUrl } from "aws-amplify/storage";
// import {  remove } from "aws-amplify/storage";
import {
  withAuthenticator,
  Button,
  Heading,
  Image,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { type AuthUser } from "aws-amplify/auth";
import { type UseAuthenticator } from "@aws-amplify/ui-react-core";
import Paper from "@mui/material/Paper";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { IconButton } from "@mui/material";

const initialState: CreatePostInput = {
  title: "",
  content: "",
  like: 0,
};
const client = generateClient();

type AppProps = {
  signOut?: UseAuthenticator["signOut"]; //() => void;
  user?: AuthUser;
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [formState, setFormState] = useState<CreatePostInput>(initialState);
  const [posts, setPosts] = useState<Post[] | CreatePostInput[]>([]);
  const [imageData, setImageData] = useState<string>("");
  const [hoveredButtons, setHoveredButtons] = useState<boolean[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const postData = await client.graphql({
        query: listPosts,
      });
      const posts = postData.data.listPosts.items;
      await Promise.all(
        posts.map(async (post) => {
          if (post.filePath) {
            const urlResult = await getUrl({ key: post.title });
            post.filePath = urlResult.url.toString();
          }
          return post;
        })
      );
      setPosts(posts);
    } catch (err) {
      console.log("error fetching posts");
    }
  }

  async function addPost() {
    try {
      if (!formState.content || !formState.title) return;
      const post = { ...formState };
      setPosts([...posts, post]);
      setFormState(initialState);
      const result = await client.graphql({
        query: createPost,
        variables: {
          input: post,
        },
      });

      // if (formState.filePath) {
      if (imageData) {
        await uploadData({
          key: result.data.createPost.id,
          // data: formState.filePath,
          data: imageData,
        }).result;
      }
    } catch (err) {
      console.log("error creating post:", err);
    }
  }

  // TODO: Implement remove post functionality
  // async function removePost(id: string) {
  //   try {
  //     const newPosts = posts.filter((post) => post.id !== id);
  //     setPosts(newPosts);
  //     await remove({ key: id });
  //     await client.graphql({
  //       query: deletePost,
  //       variables: { input: { id } },
  //     });
  //   } catch (err) {
  //     console.log("error deleting post:", err);
  //   }
  // }

  async function addLike(index: number) {
    try {
      const postToUpdate = posts[index];
      const updatedPost = { ...postToUpdate };

      // Perform the update operation, for example, incrementing the 'like' count
      updatedPost.like = updatedPost.like + 1;

      // Ensure that the id is defined before proceeding
      if (updatedPost.id) {
        // Extract only the fields required for update from the updatedPost object
        const input = {
          id: updatedPost.id,
          like: updatedPost.like,
        };

        const postData = await client.graphql({
          query: updatePost,
          variables: {
            input: input, // Pass the extracted input object
          },
        });

        // Update the posts array with the updated post
        const updatedPosts = [...posts];
        updatedPosts[index] = postData.data.updatePost;
        setPosts(updatedPosts);
      } else {
        console.log("Error: Cannot update post with undefined id");
      }
    } catch (err) {
      console.log("error updating post:", err);
    }
  }

  // TODO: Fix error in displaying image file
  // Function to handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageData(reader.result);
        }
      };
      reader.readAsDataURL(file); // Convert file to data URL
    }
  };

  const handleMouseEnter = (index: number) => {
    const updatedHoveredButtons = [...hoveredButtons];
    updatedHoveredButtons[index] = true;
    setHoveredButtons(updatedHoveredButtons);
  };

  const handleMouseLeave = (index: number) => {
    const updatedHoveredButtons = [...hoveredButtons];
    updatedHoveredButtons[index] = false;
    setHoveredButtons(updatedHoveredButtons);
  };

  return (
    <div style={styles.container}>
      <Heading level={1}>
        Hello{" "}
        {user?.username &&
          user.username.charAt(0).toUpperCase() + user.username.slice(1)}
        {"!"}
      </Heading>
      <Button onClick={signOut}>Sign out</Button>
      <h2>Amplify Blog Posts</h2>
      <input
        onChange={(event) =>
          setFormState({ ...formState, title: event.target.value })
        }
        style={styles.input}
        value={formState.title}
        placeholder="Title"
      />
      <input
        onChange={(event) =>
          setFormState({ ...formState, content: event.target.value })
        }
        style={styles.input}
        value={formState.content ?? ""}
        placeholder="Content"
      />
      <input
        type="file"
        accept="image/jpeg, image/png, image/gif"
        onChange={handleFileInputChange}
      />

      <button style={styles.button} onClick={addPost}>
        Create Post
      </button>
      {posts.map((post, index) => (
        <Paper
          variant="outlined"
          square={false}
          key={post.id ? post.id : index}
          style={styles.post}
        >
          <p style={styles.postName}>{post.title}</p>
          <p>{post.content}</p>
          {post.filePath && (
            <Image
              src={post.filePath}
              style={{ width: 200 }}
              alt={`Image for ${post.title}`}
            />
          )}
          <div>
            <IconButton
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
              onClick={() => addLike(index)}
            >
              {hoveredButtons[index] ? (
                <FavoriteIcon />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
            <p>{post.like}</p>
          </div>
        </Paper>
      ))}
    </div>
  );
};

const styles = {
  container: {
    width: "400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  post: { marginBottom: 15 },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  postName: { fontSize: 20, fontWeight: "bold" },
  button: {
    backgroundColor: "black",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
  },
} as const;

const AuthenticatedApp = withAuthenticator(App);
export default AuthenticatedApp;
