import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { type CreatePostInput, type Post } from "./API";
import { createPost, updatePost, deletePost } from "./graphql/mutations";
import { listPosts } from "./graphql/queries";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { type AuthUser } from "aws-amplify/auth";
import { type UseAuthenticator } from "@aws-amplify/ui-react-core";
import { withAuthenticator, Alert, Button } from "@aws-amplify/ui-react";
import HeaderBanner from "./components/HeaderBanner/HeaderBanner";
import FooterBanner from "./components/FooterBanner/FooterBanner";
import PostComponent from "./components/PostComponent/PostComponent";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";

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

type Timeout = ReturnType<typeof setTimeout>;

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

  useEffect(() => {
    let timer: Timeout | null = null;

    if (addPostSuccessful || removePostSuccessful) {
      timer = setTimeout(() => {
        setAddPostSuccessful(false);
        setRemovePostSuccessful(false);
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [addPostSuccessful, removePostSuccessful]);

  async function fetchPosts() {
    try {
      const postData = await client.graphql({
        query: listPosts,
      });
      const posts = postData.data.listPosts.items;
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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

      if (updatedPost.id) {
        updatedPost.like = updatedPost.like + 1;
        // Extract only the fields required for update from the updatedPost object
        const input = {
          id: updatedPost.id,
          like: updatedPost.like,
        };

        const postData = await client.graphql({
          query: updatePost,
          variables: {
            input: input,
          },
        });

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
        <div className="form">
          <input
            onChange={(event) =>
              setFormState({ ...formState, title: event.target.value })
            }
            className="titleInput"
            value={formState.title}
            placeholder="Title"
          />
          <input
            onChange={(event) =>
              setFormState({ ...formState, content: event.target.value })
            }
            className="contentInput"
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
          <button className="button" onClick={addPost}>
            Create Post
          </button>
        </div>
      )}
      {posts.length <= 0 && (
        <img
          src="/images/nopost.png"
          alt="No Posts"
          style={{ width: "400px", height: "400px", marginRight: "8px" }}
        />
      )}
      <div className="postContainer">
        {posts.map((post, index) => (
          <PostComponent
            key={post.id ?? index}
            post={post}
            index={index}
            hoveredButtons={hoveredButtons}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleLike={handleLike}
            removePost={removePost}
          />
        ))}
      </div>

      <FooterBanner />
    </div>
  );
};

const AuthenticatedApp = withAuthenticator(App);
export default AuthenticatedApp;
