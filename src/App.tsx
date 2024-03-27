import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { createPost, updatePost, deletePost } from "./graphql/mutations";
import { listPosts } from "./graphql/queries";
import { type CreatePostInput, type Post } from "./API";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { withAuthenticator, Image, Alert, Button } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { type AuthUser } from "aws-amplify/auth";
import { type UseAuthenticator } from "@aws-amplify/ui-react-core";
import Paper from "@mui/material/Paper";
import { IconButton } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ClearIcon from "@mui/icons-material/Clear";
import "./App.css";
import HeaderBanner from "./components/HeaderBanner/HeaderBanner";
import FooterBanner from "./components/FooterBanner/FooterBanner";

const initialState: CreatePostInput = {
  title: "",
  content: "",
  like: 0,
};
const client = generateClient();

type AppProps = {
  signOut?: UseAuthenticator["signOut"];
  user?: AuthUser;
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [formState, setFormState] = useState<CreatePostInput>(initialState);
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState<Post[] | CreatePostInput[]>([]);
  const [hoveredButtons, setHoveredButtons] = useState<boolean[]>([]);
  const [fileData, setFileData] = useState<File | undefined>();
  const [addPostSuccessful, setAddPostSuccessful] = useState(false);
  const [removePostSuccessful, setRemovePostSuccessful] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Function to show the Alert for 3 seconds and then hide it
  useEffect(() => {
    if (addPostSuccessful) {
      const timer = setTimeout(() => {
        setAddPostSuccessful(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [addPostSuccessful]);

  useEffect(() => {
    if (removePostSuccessful) {
      const timer = setTimeout(() => {
        setRemovePostSuccessful(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [removePostSuccessful]);

  async function fetchPosts() {
    try {
      const postData = await client.graphql({
        query: listPosts,
      });
      const posts = postData.data.listPosts.items;
      console.log("Posts", posts);
      await Promise.all(
        posts.map(async (post) => {
          if (post.filePath) {
            const imageUrl = await getUrl({ key: post.filePath });
            post.filePath = imageUrl.url.href;
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

      await client.graphql({
        query: createPost,
        variables: {
          input: post,
        },
      });

      if (formState.filePath && fileData) {
        await uploadData({
          key: formState.filePath,
          data: fileData,
        }).result;
        post.filePath = formState.filePath;
      }

      fetchPosts();
      setFormState(initialState);
      setFileData(undefined);
      if (formRef.current) {
        formRef.current.reset();
      }
      setShowForm(false);
      setAddPostSuccessful(true);
    } catch (err) {
      console.log("error creating post:", err);
    }
  }

  async function removePost(id: string | null | undefined) {
    try {
      if (!id) {
        return;
      }
      const newPosts = posts.filter((post) => post.id !== id);
      setPosts(newPosts);
      await remove({ key: id });
      await client.graphql({
        query: deletePost,
        variables: { input: { id } },
      });
      setRemovePostSuccessful(true);
    } catch (err) {
      console.log("error deleting post:", err);
    }
  }

  // Add a check for the id property before calling addLike
  async function handleLike(index: number) {
    const post = posts[index];
    if (post.id) {
      addLike(index);
    } else {
      console.log("Cannot like post with undefined id");
    }
  }

  async function addLike(index: number) {
    try {
      const postToUpdate = posts[index];
      const updatedPost = { ...postToUpdate };

      // Ensure that the id is defined before proceeding
      if (updatedPost.id) {
        // Perform the update operation, for example, incrementing the 'like' count
        updatedPost.like = updatedPost.like + 1;
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
        // Ensure that the filePath is preserved
        updatedPosts[index].filePath = postToUpdate.filePath;
        setPosts(updatedPosts);
      } else {
        console.log("Error: Cannot update post with undefined id");
      }
    } catch (err) {
      console.log("error updating post:", err);
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("file", file);
    if (file) {
      setFileData(file);
      setFormState({
        ...formState,
        filePath: file.name,
      });
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
    <div>
      <HeaderBanner
        heading="SnapCloud ☁️"
        subHeading="Connecting people, creating memories"
        user={user?.username}
        onClick={signOut}
      />
      <Button
        variation="primary"
        marginTop="30px"
        padding="20px"
        borderRadius="10px"
        onClick={() => setShowForm(!showForm)}
        marginBottom="30px"
      >
        Create a memory
      </Button>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ width: "400px" }}>
          {addPostSuccessful && (
            <Alert
              variation="success"
              isDismissible={true}
              onDismiss={() => setAddPostSuccessful(false)}
              hasIcon={true}
              heading="Hooray!"
            >
              Successfully added post
            </Alert>
          )}
          {removePostSuccessful && (
            <Alert
              variation="success"
              isDismissible={true}
              onDismiss={() => setRemovePostSuccessful(false)}
              hasIcon={true}
              heading="Hooray!"
            >
              Successfully removed post
            </Alert>
          )}
        </div>
      </div>
      {showForm && (
        <div style={styles.form}>
          <input
            onChange={(event) =>
              setFormState({ ...formState, title: event.target.value })
            }
            style={styles.titleInput}
            value={formState.title}
            placeholder="Title"
          />
          <input
            onChange={(event) =>
              setFormState({ ...formState, content: event.target.value })
            }
            style={styles.contentInput}
            value={formState.content ?? ""}
            placeholder="Content"
          />
          <form ref={formRef}>
            <input
              type="file"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileInputChange}
            />
          </form>
          <button style={styles.button} onClick={addPost}>
            Create Post
          </button>
        </div>
      )}

      <div style={styles.container}>
        {posts.map((post, index) => (
          <Paper
            variant="outlined"
            square={false}
            key={post.id ? post.id : index}
            style={styles.post}
          >
            <div style={styles.imageContainer}>
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
            <p style={styles.title}>{post.title}</p>
            <p style={styles.content}>{post.content}</p>
            <div style={styles.likeContainer}>
              <div style={styles.likeInfo}>
                <IconButton
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => handleLike(index)}
                >
                  {hoveredButtons[index] ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
                <p>{post.like}</p>
              </div>
              <IconButton
                onClick={() => removePost(post.id)}
                style={styles.deleteButton}
              >
                <ClearIcon />
              </IconButton>
            </div>
          </Paper>
        ))}
      </div>
      {posts.length <= 0 && (
        <div className="centeredContainer">
          <img
            src="public/images/nopost.png"
            alt="No Posts"
            className="centeredImage"
            style={{ width: "400px", height: "400px", marginRight: "8px" }}
          />
        </div>
      )}

      <FooterBanner />
    </div>
  );
};

const styles = {
  container: {
    width: "80%",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: 5,
  },
  centeredContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  centeredImage: {
    width: "100%",
    maxHeight: "100%",
  },

  form: {
    width: "400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  post: {
    width: 350,
    height: 350,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  imageContainer: {
    height: "70%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
  titleInput: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 16,
  },
  contentInput: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 20,
    padding: 8,
    fontSize: 16,
  },
  title: {
    height: "9%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 5,
  },
  content: {
    height: "25%",
    overflowY: "auto",
  },
  likeContainer: {
    height: "10%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "calc(100% - 30px)",
    padding: "5px 10px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  likeInfo: {
    display: "flex",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  postName: { fontSize: 20, fontWeight: "bold" },
  button: {
    backgroundColor: "#047895",
    color: "white",
    fontSize: 18,
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background-color 0.3s, box-shadow 0.3s",
    marginTop: "20px",
  },
} as const;

const AuthenticatedApp = withAuthenticator(App);
export default AuthenticatedApp;
