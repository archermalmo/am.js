const slugify = (textToSlug: string, delimiter: string = "-"): string => {
	return textToSlug
		.replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "")
		.replace(/(.)(\s|\_|\-)+(.)/g, `$1${delimiter}$3`)
		.toLowerCase();
};

export default slugify;
