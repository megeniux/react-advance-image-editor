import { useEffect, useRef, useState } from 'react';
import html2canvas from "html2canvas";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

const ImageEditor = (props) => {
    const waterMarksUrl = `../../logo512.png`; // For Watermark a local dummy url
    const effectsRef = useRef(null); // For Effects
    const cropperRef = useRef(null); // For Cropping
    const watermarkRef = useRef(null); // For Watermark
    const [loader, setLoader] = useState(true);
    const [filteredImage, setFilteredImage] = useState('');
    const [prop, setProp] = useState({
        flipHorizontal: 1,
        flipVertical: 1,
        ratioX: null,
        ratioY: null,
        zoom: 0.60,
        templateSelected: null,
        watermarkSelected: null,
        allowCrop: false,
        renderStamp: ""
    })
    const [attr, setAttr] = useState({
        imageSrc: '',
        imageName: '',
        brightnessValue: 100,
        contrastValue: 100,
        saturateValue: 100,
        grayscaleValue: 0,
        blurValue: 0,
    })

    useEffect(() => {
        const image = new Image();
        image.src = 'https://picsum.photos/id/0/1920/1080';
        image.crossOrigin = "anonymous";
        image.onload = () => {
            setAttr({ ...attr, imageSrc: image.src, imageName: "Sample Image" })
            setFilteredImage(image.src); // Setting default filtered preview same as original
            setLoader(false);
        }

        // eslint-disable-next-line 
    }, [])

    useEffect(() => {
        setLoader(true);
        applyFilter();
        // eslint-disable-next-line 
    }, [attr]);

    useEffect(() => {
        // Re-apply Template and Watermark after effects
        if (!!prop.templateSelected) {
            changeTemplate(null, prop.templateSelected)
        }
        if (!!prop.watermarkSelected) {
            changeWatermark(null, prop.watermarkSelected)
        }
        // eslint-disable-next-line 
    }, [filteredImage])

    useEffect(() => {
        if (prop.allowCrop) {
            cropOccur();
        }
        else {
            watermarkRef.current.style.display = "none";
            watermarkRef.current.style.opacity = `0%`;
            watermarkRef.current.style.background = `none`;
        }
    }, [prop.allowCrop])

    const applyFilter = () => {
        const canvas = effectsRef.current;
        const context = canvas?.getContext('2d');
        const image = new Image();
        image.src = attr.imageSrc;
        image.crossOrigin = "anonymous";
        image.onload = () => {
            if (canvas && context) {
                canvas.width = image.width;
                canvas.height = image.height;
                context.filter = getFilterString();
                context.save();
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                context.restore();

                // Apply Everything to Edited Preview
                refreshPreview(canvas);
            }
        };
    };

    const getFilterString = () => {
        return `blur(${attr.blurValue}px) brightness(${attr.brightnessValue}%) contrast(${attr.contrastValue}%) grayscale(${attr.grayscaleValue}%) saturate(${attr.saturateValue}%)`;
    };

    const refreshPreview = (item) => {
        item.toBlob((blob) => {
            if (blob) {
                const objectUrl = URL.createObjectURL(blob);
                setFilteredImage(objectUrl);
                setLoader(false);
            }
        });
    }

    const saveImage = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            const editedImageUrl = cropper.getCroppedCanvas().toDataURL();
           
            // For HTML2Canvas
            const { width, height } = cropper.cropBoxData;
            const croppedImage = document.createElement('img');
            croppedImage.src = editedImageUrl;
            croppedImage.crossOrigin = "anonymous";
            croppedImage.onload = async () => {

                // Set the div's dimensions to match the image dimensions
                const wrapper = document.createElement("div");
                if (!!prop.ratioX && !!prop.ratioY) {
                    wrapper.style.width = width * prop.ratioX + 'px';
                    wrapper.style.height = height * prop.ratioY + 'px';
                }
                else {
                    wrapper.style.width = croppedImage.naturalWidth + 'px';
                    wrapper.style.height = croppedImage.naturalHeight + 'px';
                }
                wrapper.style.backgroundImage = `url(${editedImageUrl})`;

                // Set the div's background properties
                wrapper.style.position = "relative";

                // Create a span for the watermark
                const watermarkSpan = document.createElement("div");
                watermarkSpan.className = "watermark";
                watermarkSpan.style.position = 'absolute';
                watermarkSpan.style.width = '100%';
                watermarkSpan.style.height = '100%';
                watermarkSpan.style.top = 0;
                watermarkSpan.style.left = 0;
                watermarkSpan.style.userSelect = 'none';
                watermarkSpan.style.display = prop.watermarkSelected !== null ? "block" : "none";
                if (prop.watermarkSelected !== null) {
                    const wmk = prop.watermarkSelected;
                    watermarkSpan.style.opacity = `${wmk.Opacity}%`;
                    watermarkSpan.style.background = `url("${waterMarksUrl}") ${wmk.Position}/${wmk.Size}% ${Boolean(wmk.Repeat) ? "repeat" : "no-repeat"}`;
                }

                // Append the watermark span to the div
                wrapper.appendChild(watermarkSpan);

                // Add the wrapper to the DOM
                document.body.appendChild(wrapper);

                // Capture the DOM elements to a canvas
                const canvas = await html2canvas(wrapper, { backgroundColor: null });

                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL("image/png", (prop.templateSelected?.Quality || 100) / 100);
                
                // Create a Download link
                const linkElement = document.createElement('a');
                linkElement.download = `${attr.imageName}`;
                linkElement.href = dataUrl;
                linkElement.click();
                document.body.removeChild(wrapper);
                // resetImage();
            }
        }
    };

    const resetImage = () => {
        setFilteredImage('https://picsum.photos/id/0/1920/1080');
        setAttr({ ...attr, imageSrc: 'https://picsum.photos/id/0/1920/1080', brightnessValue: 100, contrastValue: 100, saturateValue: 100, grayscaleValue: 0, blurValue: 0, })
    }

    const toggleCrop = (action) => {
        setProp({ ...prop, allowCrop: action });
    }

    const cropOccur = () => {
        const cropPox = document.querySelector(".cropper-container > .cropper-crop-box");
        if (!!cropPox) {
            const { width, height, top, left } = cropPox.getBoundingClientRect();
            watermarkRef.current.style.width = `${width}px`;
            watermarkRef.current.style.height = `${height}px`;
            watermarkRef.current.style.left = `${left}px`;
            watermarkRef.current.style.top = `${top}px`;
        }
    }

    const crop = () => {
        const cropper = cropperRef.current?.cropper;
        setFilteredImage(cropper.getCroppedCanvas().toDataURL());
    };

    const zoom = (type) => {
        const cropper = cropperRef?.current.cropper;
        const zoomValue = type === "zoomin" ? prop.zoom + 0.01 : prop.zoom - 0.01;
        cropper.zoomTo(zoomValue)
        setProp({ ...prop, zoom: zoomValue });
    }

    const rotate = () => {
        const cropper = cropperRef?.current.cropper;
        cropper.rotate(90);
    };

    const flip = (type) => {
        const cropper = cropperRef?.current.cropper;
        if (type === "h") {
            cropper.scaleX(prop.flipHorizontal === 1 ? -1 : 1);
            setProp({ ...prop, flipHorizontal: prop.flipHorizontal === 1 ? -1 : 1 })
        } else {
            cropper.scaleY(prop.flipVertical === 1 ? -1 : 1);
            setProp({ ...prop, flipVertical: prop.flipVertical === 1 ? -1 : 1 })
        }
    };

    const changeTemplate = (templateId, predefined = null) => {
        const cropper = cropperRef?.current.cropper;
        const { naturalWidth, naturalHeight, width, height } = cropper.image;
        const { rotate, scaleX, scaleY } = cropper.getData();
        const ratioX = naturalWidth / width;
        const ratioY = naturalHeight / height;
        let updatedData;
        if (templateId !== "None" || predefined !== null) {
            const tmp = predefined || templates.find(x => x.Id === templateId);
            const posX = (naturalWidth - tmp.Width) / 2;
            const posY = (naturalHeight - tmp.Height) / 2;
            updatedData = { x: posX, y: posY, width: tmp.Width, height: tmp.Height, rotate, scaleX, scaleY };
            setProp({ ...prop, templateSelected: tmp, allowCrop: true, ratioX, ratioY });
        }
        else {
            updatedData = { x: 0, y: 0, width: naturalWidth, height: naturalHeight, rotate, scaleX, scaleY };
            setProp({ ...prop, templateSelected: null, ratioX, ratioY });
        }
        cropper.setData(updatedData);
    }

    const changeWatermark = (watermarkId, predefined = null) => {
        if (watermarkId !== "None" || predefined !== null) {
            const wmk = predefined || watermarks.find(x => x.Id === watermarkId);
            setProp({ ...prop, watermarkSelected: wmk, allowCrop: true });
            watermarkRef.current.style.display = "block";
            watermarkRef.current.style.opacity = `${wmk.Opacity}%`;
            watermarkRef.current.style.background = `url("${waterMarksUrl}") ${wmk.Position}/${wmk.Size}% ${Boolean(wmk.Repeat) ? "repeat" : "no-repeat"}`;
        }
        else {
            watermarkRef.current.style.display = "none";
            watermarkRef.current.style.opacity = `0%`;
            watermarkRef.current.style.background = `none`;
        }
    }

    return (
        <div className='editor'>
            <div className='loader' style={{ display: loader ? 'flex' : 'none' }}>
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"> <path stroke="none" d="M0 0h24v24H0z" /> <path d="M12 6V3M16.25 7.75L18.4 5.6M18 12h3M16.25 16.25l2.15 2.15M12 18v3M7.75 16.25L5.6 18.4M6 12H3M7.75 7.75L5.6 5.6" /> </svg>
            </div>
            <div className='main'>
                <div className='title'>
                    <h1>Image Editor 1.0</h1>
                    <p>A react based image editor with Crop, Rotate, Flip, Filters and Watermark images.</p>
                </div>
                <div className='info'>
                    <h2 className='heading'>Info</h2>
                    <div className="box" style={{ width: "100%", overflow: 'hidden' }}>
                        <div className="img-preview" style={{ width: "100%", float: "left", height: "300px" }}></div>
                    </div>
                    <p><strong>Brightness:</strong> {attr.brightnessValue}</p>
                    <p><strong>Contrast:</strong> {attr.contrastValue}</p>
                    <p><strong>Saturation:</strong> {attr.saturateValue}</p>
                    <p><strong>Greyscale:</strong> {attr.grayscaleValue}</p>
                    <p><strong>Blur:</strong> {attr.blurValue}</p>
                    <p><strong>Template:</strong> {prop.templateSelected?.TemplateName || "None"}</p>
                    <p><strong>Watermark:</strong> {prop.templateSelected?.WatermarkName || "None"}</p>
                </div>
                <div className='preview'>
                    <div className='items' data-allow-crop={prop.allowCrop}>
                        {/* For Effects */}
                        <canvas id='effectsRef' ref={effectsRef} style={{display: 'none'}}/>

                        {/* For Cropping and Templates */}
                        <Cropper
                            src={filteredImage}
                            preview=".img-preview"
                            rotatable={true}
                            autoCropArea={1}
                            crop={cropOccur}
                            ready={cropOccur}
                            guides={false}
                            zoomOnWheel={false}
                            ref={cropperRef}
                        />

                        {/* For Watermarks this will be move into Cropper at runtime */}
                        <div id="watermarkRef" ref={watermarkRef}></div>

                    </div>
                    <div className='actions'>
                        <button onClick={() => saveImage()} data-testid="save-button" >
                            <svg viewBox="0 0 1024 1024" fill="currentColor" width="24" height="24"> <path d="M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z" /> </svg>
                        </button>
                        <button onClick={resetImage}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>
                        <button onClick={() => zoom('zoomout')}>
                            <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24" {...props} > <path d="M6 9h8v2H6z" /> <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0018 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" /> </svg>
                        </button>
                        <button onClick={() => zoom('zoomin')}>
                            <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24" {...props} > <path d="M11 6H9v3H6v2h3v3h2v-3h3V9h-3z" /> <path d="M10 2c-4.411 0-8 3.589-8 8s3.589 8 8 8a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0018 10c0-4.411-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" /> </svg>
                        </button>
                        <button onClick={() => flip('v')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" /><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" /><path d="M12 20v2" /><path d="M12 14v2" /><path d="M12 8v2" /><path d="M12 2v2" /></svg>
                        </button>
                        <button onClick={() => flip('h')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" /><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /><path d="M4 12H2" /><path d="M10 12H8" /><path d="M16 12h-2" /><path d="M22 12h-2" /></svg>
                        </button>
                        <button onClick={() => rotate()}>
                            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="24" height="24"> <path stroke="none" d="M0 0h24v24H0z" /> <path d="M19.95 11a8 8 0 10-.5 4m.5 5v-5h-5" /> <path d="M13 12 A1 1 0 0 1 12 13 A1 1 0 0 1 11 12 A1 1 0 0 1 13 12 z" /> </svg>
                        </button>
                        <button onClick={() => toggleCrop(true)} style={{ display: prop.allowCrop && 'none' }}>
                            <svg fill="currentColor" viewBox="0 0 16 16" width="24" height="24"> <path d="M3.5.5A.5.5 0 014 1v13h13a.5.5 0 010 1h-2v2a.5.5 0 01-1 0v-2H3.5a.5.5 0 01-.5-.5V4H1a.5.5 0 010-1h2V1a.5.5 0 01.5-.5zm2.5 3a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v8a.5.5 0 01-1 0V4H6.5a.5.5 0 01-.5-.5z" /> </svg>
                        </button>
                        <button onClick={() => crop()} style={{ display: !prop.allowCrop && 'none' }}>
                            <svg fill="none" viewBox="0 0 15 15" height="24" width="24" strokeWidth={2}> <path fill="currentColor" fillRule="evenodd" d="M14.707 3L5.5 12.207.293 7 1 6.293l4.5 4.5 8.5-8.5.707.707z" clipRule="evenodd" /> </svg>
                        </button>
                        <button onClick={() => toggleCrop(false)} style={{ display: !prop.allowCrop && 'none' }}>
                            <svg fill="none" viewBox="0 0 15 15" height="24" width="24" strokeWidth={2}> <path fill="currentColor" fillRule="evenodd" d="M11.782 4.032a.575.575 0 10-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 00-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 00.814.814L7.5 8.313l3.469 3.469a.575.575 0 00.813-.814L8.313 7.5l3.469-3.468z" clipRule="evenodd" /> </svg>
                        </button>
                    </div>
                </div>
                <div className='controls'>
                    <h2 className='heading'>Controls</h2>
                    <div className='filters'>
                        <div>
                            <label>Brightness: </label>
                            <input
                                id="default-range"
                                type="range"
                                step="1"
                                max={200}
                                disabled={loader}
                                value={attr.brightnessValue}
                                onChange={e => setAttr({ ...attr, brightnessValue: parseInt(e.target.value) })}
                            />
                            <input
                                type="number"
                                value={attr.brightnessValue}
                                onChange={e => setAttr({ ...attr, brightnessValue: parseInt(e.target.value) })}

                            />

                        </div>
                        <div>
                            <label>Contrast: </label>
                            <input
                                id="default-range"
                                type="range"
                                step="1"
                                max={200}
                                disabled={loader}
                                value={attr.contrastValue}
                                onChange={e => setAttr({ ...attr, contrastValue: parseInt(e.target.value) })}
                            />
                            <input
                                type="number"
                                value={attr.contrastValue}
                                onChange={e => setAttr({ ...attr, contrastValue: parseInt(e.target.value) })}

                            />

                        </div>
                        <div>
                            <label>Saturate: </label>
                            <input
                                id="default-range"
                                type="range"
                                step="1"
                                disabled={loader}
                                max={200}
                                value={attr.saturateValue}
                                onChange={e => setAttr({ ...attr, saturateValue: parseInt(e.target.value) })}
                            />
                            <input
                                type="number"
                                value={attr.saturateValue}
                                onChange={e => setAttr({ ...attr, saturateValue: parseInt(e.target.value) })}

                            />
                        </div>
                        <div>
                            <label>Grayscale: </label>
                            <input
                                id="grayscaleSlider"
                                type="range"
                                value={attr.grayscaleValue}
                                disabled={loader}
                                max="100"
                                onChange={e => setAttr({ ...attr, grayscaleValue: parseInt(e.target.value) })}
                            />
                            <input
                                type="number"
                                value={attr.grayscaleValue}
                                onChange={e => setAttr({ ...attr, grayscaleValue: parseInt(e.target.value) })}

                            />
                        </div>
                        <div>
                            <label>Blur: </label>
                            <input
                                id="blurValue"
                                type="range"
                                value={attr.blurValue}
                                disabled={loader}
                                max="100"
                                onChange={e => setAttr({ ...attr, blurValue: parseInt(e.target.value) })}
                            />
                            <input
                                type="number"
                                value={attr.blurValue}
                                onChange={e => setAttr({ ...attr, blurValue: parseInt(e.target.value) })}

                            />
                        </div>
                        <hr />
                        <div>
                            <label>Templates: </label>
                            <select name="templates" id="templates" onChange={(e) => changeTemplate(e.target.value)}>
                                <option value={null}>None</option>
                                {templates.map(e => <option key={e.Id} value={e.Id} disabled={e.Id === prop.templateSelected?.Id}>{e.TemplateName}</option>)}
                            </select>
                        </div>
                        <hr />
                        <div>
                            <label>Watermarks: </label>
                            <select name="watermarks" id="watermarks" onChange={(e) => changeWatermark(e.target.value)}>
                                <option value={null}>None</option>
                                {watermarks.map(e => <option key={e.Id} value={e.Id} disabled={e.Id === prop.watermarkSelected?.Id}>{e.WatermarkName}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className='footer'>
                    <p>Made with <span style={{color: 'red'}}>❤</span> by Ayaz.B</p>
                </div>
            </div>
        </div>
    );
}

const templates = [
    {
        "TemplateName": "Facebook Profile Picture",
        "Quality": 100,
        "Width": 180,
        "Height": 180,
        "Id": "8bc265a0-3d24-4c5c-937a-255f5a57f693",
    },
    {
        "TemplateName": "Facebook Cover",
        "Quality": 80,
        "Width": 820,
        "Height": 312,
        "Id": "40831f96-d9db-4f3f-9401-f05e123a7e85",
    }
]

const watermarks = [
    {
        "WatermarkName": "Sample - Left-Top",
        "Repeat": false,
        "Position": "left top",
        "Opacity": 70,
        "Size": 25,
        "Id": "8bc265a0-3d24-4c5c-4545-255f5a57f693",
    },
    {
        "WatermarkName": "Sample - Right-bottom",
        "Repeat": false,
        "Position": "right Bottom",
        "Opacity": 50,
        "Size": 15,
        "Id": "6df265a0-3d24-4c5c-937a-255f5a57f693",
    },
    {
        "WatermarkName": "Sample - Center",
        "Repeat": false,
        "Position": "center center",
        "Opacity": 80,
        "Size": 25,
        "Id": "1mn265a0-3d24-23dd-937a-255f5a57f693",
    },
    {
        "WatermarkName": "Sample - Multiple",
        "Repeat": true,
        "Position": "center center",
        "Opacity": 50,
        "Size": 25,
        "Id": "8bc265a0-3d24-h455-937a-255f5a57f693",
    }
]

export default ImageEditor;