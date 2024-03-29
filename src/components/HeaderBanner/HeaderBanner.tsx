import React from "react";
import { Flex, Text, Button } from "@aws-amplify/ui-react";
import { type UseAuthenticator } from "@aws-amplify/ui-react-core";

type HeaderBannerProps = {
  heading: string;
  subHeading: string;
  user: string | undefined;
  onClick?: UseAuthenticator["signOut"];
};

const HeaderBanner: React.FC<HeaderBannerProps> = ({
  heading,
  subHeading,
  user,
  onClick,
}) => {
  return (
    <div>
      <Flex
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        paddingTop="10px"
        backgroundColor="#E1ECF0"
      >
        <Button
          fontSize="16px"
          style={{ display: "flex", alignItems: "center" }}
        >
          <img
            src="/images/avatarplaceholder.png"
            alt="Avatar"
            style={{ width: "24px", height: "24px", marginRight: "8px" }}
          />
          Hello {user && user.charAt(0).toUpperCase() + user.slice(1)}
          {"!"}
        </Button>
        <Button onClick={onClick} style={{ marginRight: "20px" }}>
          Sign out
        </Button>
      </Flex>
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        padding="20px"
        backgroundColor="#E1ECF0"
      >
        <Text fontSize="24px" fontWeight="bold" marginBottom="10px">
          {heading}
        </Text>
        <Text fontSize="16px" color="#666" marginBottom="20px">
          {subHeading}
        </Text>
      </Flex>
    </div>
  );
};

export default HeaderBanner;
