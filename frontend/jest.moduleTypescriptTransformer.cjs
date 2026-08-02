module.exports = {
  createTransformer({ transformerPath, transformerOptions }) {
    const delegate =
      require(transformerPath).createTransformer(transformerOptions);

    return {
      ...delegate,
      process(source, filename, options) {
        return delegate.process(
          source,
          filename.replace(/\.mts$/, ".ts"),
          options,
        );
      },
    };
  },
};
