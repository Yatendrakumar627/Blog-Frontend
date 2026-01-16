import { Loader, Center } from '@mantine/core';

const AppLoader = ({ fullHeight = false, centered = false, size = 'md', type, height, ...props }) => {
    if (fullHeight) {
        return (
            <Center h="100vh" w="100%">
                <Loader size="xl" type={type} {...props} />
            </Center>
        );
    }

    if (centered) {
        return (
            <Center w="100%" py="md" h={height}>
                <Loader size={size} type={type} {...props} />
            </Center>
        );
    }

    return <Loader size={size} type={type} {...props} />;
};

export default AppLoader;
