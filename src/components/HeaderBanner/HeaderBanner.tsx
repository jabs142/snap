import React from "react";
import { Flex, Text, Button } from "@aws-amplify/ui-react"; // Import necessary UI components

type HeaderBannerProps = {
  heading: string;
  subHeading: string;
  buttonText: string;
  onClick: () => void;
};

const HeaderBanner: React.FC<HeaderBannerProps> = ({
  heading,
  subHeading,
  buttonText,
  onClick,
}) => {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      padding="40px"
      backgroundColor="#E1ECF0"
      marginTop="40px"
    >
      <Text fontSize="24px" fontWeight="bold" marginBottom="10px">
        {heading}
      </Text>
      <Text fontSize="16px" color="#666" marginBottom="20px">
        {subHeading}
      </Text>
      <Button onClick={onClick}>{buttonText}</Button>
    </Flex>
  );
};

export default HeaderBanner;
