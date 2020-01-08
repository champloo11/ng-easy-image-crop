# Angular Easy Image Crop
Angular directive for selecting an area within an image to crop. Useful for gathering rectangular data (represented as topLeftX, topLeftY, width, height). 

# Supports

- Original image dimensions
- Scaled image dimensions 
- Dynamic/configurable aspect-ratio crop area 

## Options / Bindings
```html
<div image-crop 
	aspect-ratio="'{int}/{int}'" 
	img-src="{string}" 
	img-load="{string}"
	display-height="{int}" 
	display-width = "{int}"
	scaled-height="{int}" 
	scaled-width="{int}" 
	scaled-top="{int}" 
	scaled-left="{int}" 
	style="position:relative;">
</div>
```

- aspect-ratio
 - A string of two integers split by a '/'. Representing a ratio to enforce on the crop-box.

- img-src
 - The URL pointing to the image to be cropped.

- img-load
 - A load icon to display while the image is loading. 

- display-height 
 - The height of the crop-box inside of the directive. **Not scaled to the original image height**.

- display-width
 - The width of the crop-box inside of the directive. **Not scaled to the original image width**. 

- scaled-height
 - The height of the crop-box relative to the original image dimensions. **Scaled to original image dimensions**

- scaled-width
 - The width of the crop-box relative to the original image dimensions. **Scaled to original image dimensions**

- scaled-top / scaled-left 
  - The top-left point of the crop box. Relative to the original image dimensions. 
