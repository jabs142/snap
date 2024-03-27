import "./NavBar.css";
import { type AuthUser } from "aws-amplify/auth";
import { type UseAuthenticator } from "@aws-amplify/ui-react-core";
import { Button, withAuthenticator } from "@aws-amplify/ui-react";

type AppProps = {
  signOut?: UseAuthenticator["signOut"];
  user?: AuthUser;
};

// TODO: Fix - unable to log out via this button (works with button on App.tsx)

const NavBar: React.FC<AppProps> = ({ signOut }) => {
  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/about">Albums</a>
        </li>
        <li>
          <a href="/contact">Contact</a>
        </li>
        <Button onClick={signOut}>Sign out</Button>
      </ul>
    </nav>
  );
};

const AuthenticatedApp = withAuthenticator(NavBar);
export default AuthenticatedApp;
